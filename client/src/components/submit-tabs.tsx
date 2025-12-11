"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  LinkIcon,
  VideoIcon,
  XIcon,
  FileUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileUpload, formatBytes, type FileWithPreview } from "@/hooks/use-file-upload";

interface TabValidation {
  isValid: boolean;
  title: string;
  body: string;
  linkUrl: string;
  files: File[];
}

interface SubmitTabsProps {
  activeTab?: "text" | "media" | "link";
  onActiveTabChange?: (tab: "text" | "media" | "link") => void;
  onValidationChange?: (validation: TabValidation) => void;
}

const MAX_TITLE_LENGTH = 300;
const MAX_BODY_LENGTH = 40000;

export default function SubmitTabs({
  activeTab: controlledActiveTab,
  onActiveTabChange,
  onValidationChange,
}: SubmitTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<"text" | "media" | "link">("text");
  const activeTab = controlledActiveTab ?? internalActiveTab;

  // Form state persisted across tabs
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Validation state
  const [titleError, setTitleError] = useState("");
  const [bodyError, setBodyError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [fileError, setFileError] = useState("");

  // Touched state (for showing errors only after interaction)
  const [titleTouched, setTitleTouched] = useState(false);
  const [bodyTouched, setBodyTouched] = useState(false);
  const [linkTouched, setLinkTouched] = useState(false);

  // File upload hook
  const [
    { files, isDragging, errors: fileUploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
  });

  // Validate title
  const validateTitle = useCallback((value: string) => {
    if (!value.trim()) {
      return "Title is required";
    }
    if (value.length > MAX_TITLE_LENGTH) {
      return `Title cannot exceed ${MAX_TITLE_LENGTH} characters`;
    }
    return "";
  }, []);

  // Validate body (only required for text tab)
  const validateBody = useCallback((value: string, tab: string) => {
    if (tab === "text" && !value.trim()) {
      return "Body is required";
    }
    if (value.length > MAX_BODY_LENGTH) {
      return `Body cannot exceed ${MAX_BODY_LENGTH} characters`;
    }
    return "";
  }, []);

  // Validate link URL
  const validateLink = useCallback((value: string) => {
    if (!value.trim()) {
      return "URL is required";
    }
    
    // Check for dangerous protocols
    const trimmed = value.trim().toLowerCase();
    if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:")) {
      return "Invalid URL protocol";
    }
    
    // Validate URL format
    try {
      const url = new URL(value.trim());
      if (!["http:", "https:"].includes(url.protocol)) {
        return "Please enter a valid URL (include https://)";
      }
    } catch {
      return "Please enter a valid URL (include https://)";
    }
    
    return "";
  }, []);

  // Validate files
  const validateFiles = useCallback((fileList: FileWithPreview[]) => {
    if (fileList.length === 0) {
      return "At least one file is required";
    }
    return "";
  }, []);

  // Update validation on state changes
  useEffect(() => {
    const newTitleError = validateTitle(title);
    setTitleError(newTitleError);

    const newBodyError = validateBody(body, activeTab);
    setBodyError(newBodyError);

    const newLinkError = activeTab === "link" ? validateLink(linkUrl) : "";
    setLinkError(newLinkError);

    const newFileError = activeTab === "media" ? validateFiles(files) : "";
    setFileError(newFileError);

    // Determine if current tab is valid
    let isValid = false;
    const actualFiles = files.map((f) => (f.file instanceof File ? f.file : null)).filter(Boolean) as File[];

    if (activeTab === "text") {
      isValid = !newTitleError && !newBodyError;
    } else if (activeTab === "media") {
      isValid = !newTitleError && files.length > 0;
    } else if (activeTab === "link") {
      isValid = !newTitleError && !newLinkError;
    }

    onValidationChange?.({
      isValid,
      title,
      body,
      linkUrl,
      files: actualFiles,
    });
  }, [title, body, linkUrl, files, activeTab, validateTitle, validateBody, validateLink, validateFiles, onValidationChange]);

  const handleTabChange = (value: string) => {
    const tab = value as "text" | "media" | "link";
    setInternalActiveTab(tab);
    onActiveTabChange?.(tab);
  };

  const getFileIcon = (file: File | { type: string; name: string }) => {
    const fileType = file instanceof File ? file.type : file.type;
    const fileName = file instanceof File ? file.name : file.name;

    if (fileType.startsWith("image/")) {
      return <ImageIcon className="size-4 opacity-60" />;
    }
    if (fileType.includes("video/")) {
      return <VideoIcon className="size-4 opacity-60" />;
    }
    if (fileType.includes("pdf") || fileName.endsWith(".pdf")) {
      return <FileTextIcon className="size-4 opacity-60" />;
    }
    return <FileIcon className="size-4 opacity-60" />;
  };

  const remainingTitleChars = MAX_TITLE_LENGTH - title.length;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full h-auto rounded-none border-b bg-transparent p-0 justify-start">
        <TabsTrigger
          value="text"
          className="relative rounded-none py-3 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          Text
        </TabsTrigger>
        <TabsTrigger
          value="media"
          className="relative rounded-none py-3 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Images & Video
        </TabsTrigger>
        <TabsTrigger
          value="link"
          className="relative rounded-none py-3 px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Link
        </TabsTrigger>
      </TabsList>

      {/* Text Tab */}
      <TabsContent value="text" className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="text-title">Title *</Label>
            <span className={`text-xs ${remainingTitleChars < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {remainingTitleChars} characters remaining
            </span>
          </div>
          <Input
            id="text-title"
            placeholder="An interesting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            maxLength={MAX_TITLE_LENGTH + 10}
            className={titleTouched && titleError ? "border-destructive" : ""}
          />
          {titleTouched && titleError && (
            <p className="text-destructive text-xs">{titleError}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="text-body">Body *</Label>
            <span className="text-xs text-muted-foreground">
              {body.length.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
            </span>
          </div>
          <Textarea
            id="text-body"
            placeholder="Write your post content here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={() => setBodyTouched(true)}
            rows={8}
            className={`resize-y min-h-[200px] ${bodyTouched && bodyError ? "border-destructive" : ""}`}
          />
          {bodyTouched && bodyError && (
            <p className="text-destructive text-xs">{bodyError}</p>
          )}
        </div>
      </TabsContent>

      {/* Media Tab */}
      <TabsContent value="media" className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="media-title">Title *</Label>
            <span className={`text-xs ${remainingTitleChars < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {remainingTitleChars} characters remaining
            </span>
          </div>
          <Input
            id="media-title"
            placeholder="An interesting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            maxLength={MAX_TITLE_LENGTH + 10}
            className={titleTouched && titleError ? "border-destructive" : ""}
          />
          {titleTouched && titleError && (
            <p className="text-destructive text-xs">{titleError}</p>
          )}
        </div>

        {/* File Upload Area */}
        <div className="space-y-2">
          <Label>Upload Files *</Label>
          <div
            className={`flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors hover:bg-accent/50 cursor-pointer ${
              isDragging ? "bg-accent/50 border-primary" : "border-input"
            } ${fileError && files.length === 0 ? "border-destructive" : ""}`}
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openFileDialog()}
          >
            <input {...getInputProps()} aria-label="Upload files" className="sr-only" />
            <div className="flex flex-col items-center justify-center text-center">
              <div
                aria-hidden="true"
                className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
              >
                <FileUpIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 font-medium text-sm">Upload files</p>
              <p className="mb-2 text-muted-foreground text-xs">
                Drag & drop or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-1 text-muted-foreground/70 text-xs">
                <span>All files</span>
                <span>∙</span>
                <span>Max 10 files</span>
                <span>∙</span>
                <span>Up to 100MB each</span>
              </div>
            </div>
          </div>

          {fileUploadErrors.length > 0 && (
            <p className="text-destructive text-xs">{fileUploadErrors[0]}</p>
          )}

          {files.length === 0 && fileError && (
            <p className="text-destructive text-xs">{fileError}</p>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3"
                key={file.id}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border overflow-hidden">
                    {file.preview && (file.file instanceof File ? file.file.type.startsWith("image/") : false) ? (
                      <img src={file.preview} alt="" className="size-full object-cover" />
                    ) : (
                      getFileIcon(file.file)
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate font-medium text-[13px]">
                      {file.file instanceof File ? file.file.name : file.file.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(file.file instanceof File ? file.file.size : file.file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  aria-label="Remove file"
                  className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                  onClick={() => removeFile(file.id)}
                  size="icon"
                  variant="ghost"
                  type="button"
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </Button>
              </div>
            ))}

            {files.length > 1 && (
              <Button onClick={clearFiles} size="sm" variant="outline" type="button">
                Remove all files
              </Button>
            )}
          </div>
        )}

        {/* Optional Body */}
        <div className="space-y-2">
          <Label htmlFor="media-body">Caption (optional)</Label>
          <Textarea
            id="media-body"
            placeholder="Add a caption..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="resize-y"
          />
        </div>
      </TabsContent>

      {/* Link Tab */}
      <TabsContent value="link" className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="link-title">Title *</Label>
            <span className={`text-xs ${remainingTitleChars < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {remainingTitleChars} characters remaining
            </span>
          </div>
          <Input
            id="link-title"
            placeholder="An interesting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            maxLength={MAX_TITLE_LENGTH + 10}
            className={titleTouched && titleError ? "border-destructive" : ""}
          />
          {titleTouched && titleError && (
            <p className="text-destructive text-xs">{titleError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="link-url">URL *</Label>
          <Input
            id="link-url"
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onBlur={() => setLinkTouched(true)}
            className={linkTouched && linkError ? "border-destructive" : ""}
          />
          {linkTouched && linkError && (
            <p className="text-destructive text-xs">{linkError}</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
