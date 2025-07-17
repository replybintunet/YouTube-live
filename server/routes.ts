import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, paymentSchema, streamConfigSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn, type ChildProcess } from "child_process";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const sessionId = req.cookies?.sessionId || nanoid();
      const ext = path.extname(file.originalname);
      cb(null, `${sessionId}_${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (file.mimetype.startsWith('video/') || 
        file.mimetype === 'application/octet-stream' ||
        allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Store active stream processes
const activeStreams = new Map<string, ChildProcess>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable cookies and CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Cookie');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { accessCode } = loginSchema.parse(req.body);
      
      if (accessCode !== "bintunet") {
        return res.status(401).json({ error: "Invalid access code" });
      }

      const sessionId = nanoid();
      res.cookie('sessionId', sessionId, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      res.json({ success: true, sessionId });
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  

      // Calculate expiration
      let expiresAt: Date | null = null;
      if (plan === "5hours") {
        expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000);
      } else if (plan === "12hours") {
        expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
      }
      // lifetime has no expiration

      const session = await storage.createSession({
        sessionId,
        plan,
        expiresAt
      });

      res.json({ success: true, session });
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // Check session status
  app.get("/api/session", async (req, res) => {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ error: "No session found" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
      }

      // Check if session is expired
      if (session.expiresAt && session.expiresAt < new Date()) {
        await storage.deleteSession(sessionId);
        return res.status(401).json({ error: "Session expired" });
      }

      res.json({ session });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // System status endpoint
  app.get("/api/system-status", (req, res) => {
    // Simulate real system metrics
    const status = {
      ping: Math.floor(Math.random() * 20) + 20,
      connection: "Connected",
      wifi: `Strong (${Math.floor(Math.random() * 15) + 75}%)`
    };
    res.json(status);
  });

  // Video upload endpoint
  app.post("/api/upload-video", upload.single('video'), async (req: any, res) => {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ error: "No session found" });
      }

      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      // Get or create stream session
      let streamSession = await storage.getStreamSession(sessionId);
      if (!streamSession) {
        streamSession = await storage.createStreamSession({
          sessionId,
          streamKeys: [],
          videoFiles: [],
          isActive: false,
          loopVideo: false,
          mobileMode: false
        });
      }

      // Add video file to the session
      const videoFile = JSON.stringify({
        fileName: req.file.originalname,
        filePath: req.file.path,
        size: req.file.size
      });

      const videoFiles = streamSession.videoFiles || [];
      videoFiles.push(videoFile);

      await storage.updateStreamSession(sessionId, {
        videoFiles: videoFiles
      });

      res.json({ 
        success: true, 
        file: {
          name: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Stream configuration endpoint
  app.post("/api/stream-config", async (req, res) => {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ error: "No session found" });
      }

      const { streamKeys, loopVideo, mobileMode } = streamConfigSchema.parse(req.body);
      
      const streamSession = await storage.getStreamSession(sessionId);
      if (!streamSession) {
        return res.status(400).json({ error: "No stream session found" });
      }

      const keys = streamKeys.split('\n').filter(key => key.trim()).map(key => key.trim());
      
      const updated = await storage.updateStreamSession(sessionId, {
        streamKeys: keys,
        loopVideo,
        mobileMode
      });

      res.json({ success: true, streamSession: updated });
    } catch (error) {
      res.status(400).json({ error: "Invalid stream configuration" });
    }
  });

  // Start/stop stream endpoint
  app.post("/api/stream/:action", async (req, res) => {
    try {
      const { action } = req.params;
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ error: "No session found" });
      }

      const streamSession = await storage.getStreamSession(sessionId);
      if (!streamSession) {
        return res.status(400).json({ error: "No stream session found" });
      }

      if (action === "start") {
        if (!streamSession.videoFiles || streamSession.videoFiles.length === 0) {
          return res.status(400).json({ error: "No video files found" });
        }

        if (!streamSession.streamKeys || streamSession.streamKeys.length === 0) {
          return res.status(400).json({ error: "No stream keys configured" });
        }

        // Stop any existing stream
        if (activeStreams.has(sessionId)) {
          activeStreams.get(sessionId)?.kill();
          activeStreams.delete(sessionId);
        }

        // Use the first video file for streaming
        const firstVideo = JSON.parse(streamSession.videoFiles[0]);
        if (!fs.existsSync(firstVideo.filePath)) {
          return res.status(400).json({ error: "Video file not found" });
        }

        // Build FFmpeg command for multi-streaming
        const ffmpegArgs = [
          '-re', // Read input at native frame rate
          '-i', firstVideo.filePath,
          '-c:v', 'libx264',
          '-preset', streamSession.mobileMode ? 'fast' : 'medium',
          '-b:v', streamSession.mobileMode ? '1000k' : '2500k',
          '-maxrate', streamSession.mobileMode ? '1000k' : '2500k',
          '-bufsize', streamSession.mobileMode ? '2000k' : '5000k',
          '-pix_fmt', 'yuv420p',
          '-g', '50',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-ac', '2',
          '-ar', '44100'
        ];

        // Add loop option if enabled
        if (streamSession.loopVideo) {
          ffmpegArgs.splice(1, 0, '-stream_loop', '-1');
        }

        // Add output streams for each YouTube key
        streamSession.streamKeys.forEach(key => {
          ffmpegArgs.push(
            '-f', 'flv',
            `rtmp://a.rtmp.youtube.com/live2/${key.trim()}`
          );
        });

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
        
        ffmpegProcess.on('error', (error) => {
          console.error('FFmpeg error:', error);
        });

        ffmpegProcess.on('close', (code) => {
          console.log(`FFmpeg process exited with code ${code}`);
          activeStreams.delete(sessionId);
          storage.updateStreamSession(sessionId, { isActive: false });
        });

        activeStreams.set(sessionId, ffmpegProcess);
        await storage.updateStreamSession(sessionId, { isActive: true });

        res.json({ 
          success: true, 
          message: "Stream started",
          activeStreams: streamSession.streamKeys.length
        });

      } else if (action === "stop") {
        const process = activeStreams.get(sessionId);
        if (process) {
          process.kill();
          activeStreams.delete(sessionId);
        }

        await storage.updateStreamSession(sessionId, { isActive: false });

        // Clean up uploaded files
        if (streamSession.videoFiles) {
          streamSession.videoFiles.forEach(videoFileStr => {
            const videoFile = JSON.parse(videoFileStr);
            if (fs.existsSync(videoFile.filePath)) {
              fs.unlinkSync(videoFile.filePath);
            }
          });
        }
        await storage.deleteStreamSession(sessionId);

        res.json({ success: true, message: "Stream stopped" });
      } else {
        res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ error: "Stream operation failed" });
    }
  });

  // Get stream status
  app.get("/api/stream-status", async (req, res) => {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ error: "No session found" });
      }

      const streamSession = await storage.getStreamSession(sessionId);
      
      let fileName = '';
      let hasFile = false;
      
      if (streamSession?.videoFiles && streamSession.videoFiles.length > 0) {
        const firstVideo = JSON.parse(streamSession.videoFiles[0]);
        fileName = firstVideo.fileName;
        hasFile = fs.existsSync(firstVideo.filePath);
      }
      
      res.json({
        isActive: streamSession?.isActive || false,
        hasFile,
        activeStreams: streamSession?.streamKeys?.length || 0,
        fileName,
        loopVideo: streamSession?.loopVideo || false,
        mobileMode: streamSession?.mobileMode || false,
        streamKeys: streamSession?.streamKeys?.join('\n') || ''
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get stream status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
