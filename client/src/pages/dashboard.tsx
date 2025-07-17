import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { streamConfigSchema, type StreamConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useSystemStatus } from "@/hooks/use-system-status";
import { 
  TrendingUp, 
  Youtube, 
  Upload, 
  Radio as Broadcast,
  Play,
  Square,
  Video,
  Trash2,
  Info,
  Wifi,
  Plus,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [streamKeys, setStreamKeys] = useState<string[]>([""]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: systemStatus } = useSystemStatus();
  
  const { data: streamStatus } = useQuery({
    queryKey: ["/api/stream-status"],
    refetchInterval: 2000,
  });

  const form = useForm<StreamConfig>({
    resolver: zodResolver(streamConfigSchema),
    defaultValues: {
      streamKeys: "",
      loopVideo: false,
      mobileMode: false,
    },
  });

  // Set form values when stream status loads
  useEffect(() => {
    if (streamStatus) {
      const keys = streamStatus.streamKeys ? streamStatus.streamKeys.split('\n').filter(key => key.trim()) : [""];
      setStreamKeys(keys.length > 0 ? keys : [""]);
      form.setValue("streamKeys", streamStatus.streamKeys || "");
      form.setValue("loopVideo", streamStatus.loopVideo || false);
      form.setValue("mobileMode", streamStatus.mobileMode || false);
      if (streamStatus.fileName) {
        setUploadedFile({ name: streamStatus.fileName, size: 0 });
      }
    }
  }, [streamStatus, form]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      
      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedFile(data.file);
      queryClient.invalidateQueries({ queryKey: ["/api/stream-status"] });
      toast({
        title: "Video uploaded successfully",
        description: `${data.file.name} is ready for streaming`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video file",
        variant: "destructive",
      });
    },
  });

  const configMutation = useMutation({
    mutationFn: async (data: StreamConfig) => {
      const response = await apiRequest("POST", "/api/stream-config", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stream-status"] });
      toast({
        title: "Configuration updated",
        description: "Stream settings have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Configuration failed", 
        description: error.message || "Failed to update stream configuration",
        variant: "destructive",
      });
    },
  });

  const streamMutation = useMutation({
    mutationFn: async (action: "start" | "stop") => {
      const response = await apiRequest("POST", `/api/stream/${action}`);
      return response.json();
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stream-status"] });
      toast({
        title: action === "start" ? "Stream started" : "Stream stopped",
        description: data.message,
      });
      if (action === "stop") {
        setUploadedFile(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Stream operation failed",
        description: error.message || "Failed to control stream",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateStreamKey = (key: string): boolean => {
    // Stream key should be alphanumeric with hyphens, not a full URL
    const streamKeyPattern = /^[a-zA-Z0-9\-_]{4,}$/;
    return streamKeyPattern.test(key.trim());
  };

  const addStreamKey = () => {
    setStreamKeys([...streamKeys, ""]);
  };

  const removeStreamKey = (index: number) => {
    if (streamKeys.length > 1) {
      const newKeys = streamKeys.filter((_, i) => i !== index);
      setStreamKeys(newKeys);
      updateFormStreamKeys(newKeys);
    }
  };

  const updateStreamKey = (index: number, value: string) => {
    const newKeys = [...streamKeys];
    newKeys[index] = value;
    setStreamKeys(newKeys);
    updateFormStreamKeys(newKeys);
  };

  const updateFormStreamKeys = (keys: string[]) => {
    const validKeys = keys.filter(key => key.trim()).join('\n');
    form.setValue("streamKeys", validKeys);
  };

  const onConfigSubmit = (data: StreamConfig) => {
    // Validate all stream keys
    const keys = streamKeys.filter(key => key.trim());
    const invalidKeys = keys.filter(key => !validateStreamKey(key));
    
    if (invalidKeys.length > 0) {
      toast({
        title: "Invalid stream keys",
        description: "Stream keys should contain only letters, numbers, hyphens and underscores (no URLs)",
        variant: "destructive",
      });
      return;
    }

    if (keys.length === 0) {
      toast({
        title: "No stream keys",
        description: "Please add at least one valid stream key",
        variant: "destructive",
      });
      return;
    }

    configMutation.mutate(data);
  };

  const handleStreamToggle = () => {
    const action = streamStatus?.isActive ? "stop" : "start";
    streamMutation.mutate(action);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-6 space-y-6">
      {/* System Status */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="text-white w-4 h-4" />
          </div>
          System Status
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Ping</span>
            <div className="flex items-center space-x-2">
              <span className="status-indicator w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-green-600 font-medium">
                {systemStatus?.ping || "---"}ms
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Connection</span>
            <div className="flex items-center space-x-2">
              <span className="status-indicator w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-green-600 font-medium">
                {systemStatus?.connection || "Unknown"}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">WiFi Signal</span>
            <div className="flex items-center space-x-2">
              <Wifi className="text-green-600 w-4 h-4" />
              <span className="text-green-600 font-medium">
                {systemStatus?.wifi || "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Configuration */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
            <Youtube className="text-white w-4 h-4" />
          </div>
          YouTube Multi-Stream
        </h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onConfigSubmit)} className="space-y-4">
            <div>
              <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">
                YouTube Stream Keys
              </FormLabel>
              <div className="space-y-3">
                {streamKeys.map((key, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Stream key ${index + 1} (e.g., xxxx-xxxx-xxxx-xxxx)`}
                      value={key}
                      onChange={(e) => updateStreamKey(index, e.target.value)}
                      className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
                        key.trim() && !validateStreamKey(key) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {streamKeys.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStreamKey(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStreamKey}
                  className="w-full border-dashed border-gray-300 text-gray-600 hover:text-sky-600 hover:border-sky-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Stream Key
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter only the stream keys (not full URLs). Each video will stream to all channels simultaneously.
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="loopVideo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-gray-700">Loop Video</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobileMode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-gray-700">Mobile Mode</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={configMutation.isPending}
            >
              {configMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </form>
        </Form>
      </div>

      {/* Video Upload */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
            <Upload className="text-white w-4 h-4" />
          </div>
          Video Content
        </h3>

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-sky-500 transition-all cursor-pointer"
          onClick={() => !uploadedFile && fileInputRef.current?.click()}
        >
          {!uploadedFile ? (
            <div>
              <Upload className="text-gray-400 w-12 h-12 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Click to upload video file</p>
              <p className="text-xs text-gray-500">Auto-deletes after stream ends</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadMutation.isPending}
              />
              {uploadMutation.isPending && (
                <p className="text-sky-600 text-sm mt-2">Uploading...</p>
              )}
            </div>
          ) : (
            <div>
              <Video className="text-sky-600 w-8 h-8 mx-auto mb-2" />
              <p className="text-gray-800 font-medium">{uploadedFile.name}</p>
              {uploadedFile.size > 0 && (
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-red-600 hover:text-red-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stream Controls */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <Broadcast className="text-white w-4 h-4" />
          </div>
          Live Stream Control
        </h3>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status</span>
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  streamStatus?.isActive 
                    ? "bg-green-500 status-indicator" 
                    : "bg-gray-400"
                }`}
              ></span>
              <span
                className={`font-medium ${
                  streamStatus?.isActive ? "text-green-600" : "text-gray-600"
                }`}
              >
                {streamStatus?.isActive ? "Streaming" : "Ready"}
              </span>
            </div>
          </div>
        </div>

        <Button
          className={`w-full font-semibold py-4 px-6 rounded-xl ${
            streamStatus?.isActive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "btn-primary text-white"
          }`}
          onClick={handleStreamToggle}
          disabled={streamMutation.isPending}
        >
          {streamStatus?.isActive ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop Stream
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Stream
            </>
          )}
        </Button>

        {streamStatus?.isActive && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700 text-sm">
              <Info className="w-4 h-4 mr-2" />
              <span>
                Streaming to {streamStatus.activeStreams} YouTube channel{streamStatus.activeStreams !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
