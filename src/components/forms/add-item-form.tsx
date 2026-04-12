"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { usePos } from "@/hooks/use-pos";
import {
  ImagePlus,
  Loader2,
  X,
  CheckCircle2,
  Link as LinkIcon,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  basePrice: z.coerce.number().min(0, "Base price must be a positive number"),
  costPrice: z.coerce.number().min(0, "Cost price must be a positive number"),
  stockQuantity: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock must be a positive number"),
  taxRate: z.coerce.number().min(0, "Tax rate must be a positive number"),
  imageUrl: z.string().optional().or(z.literal("")),
});

interface AddItemFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
}

export function AddItemForm({ onSubmit }: AddItemFormProps) {
  const { uploadProductImage } = usePos();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<"url" | "file">("file");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      basePrice: 0,
      costPrice: 0,
      stockQuantity: 0,
      taxRate: 0,
      imageUrl: "",
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Store file temporarily in form state or handle upload on submit
    // But the request says we should decide on an ID and use that for both.
    // So we will upload AFTER addProduct returns an ID, or we generate one now.
  };

  const processSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // 1. Create product first to get ID
      // The parent onSubmit must return the productId
      const productId = await (onSubmit(values) as any);

      if (!productId) {
        throw new Error("Product creation failed");
      }

      // 2. If there's a file image preview, upload it
      if (
        imageSource === "file" &&
        imagePreview &&
        imagePreview.startsWith("data:")
      ) {
        setIsUploading(true);
        try {
          const url = await uploadProductImage(
            productId,
            imagePreview,
            (progress) => {
              setUploadProgress(progress);
            },
          );
          toast.success("Image secured to storage");
        } catch (e) {
          toast.error("Cloud storage upload failed, using preview link");
          console.error(e);
        } finally {
          setIsUploading(false);
        }
      }

      form.reset();
      setImagePreview(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Submit error", error);
      toast.error("Failed to create product");
    }
  };

  const handleImageInput = useCallback(
    async (productId: string) => {
      if (!imagePreview) return;

      setIsUploading(true);
      try {
        // If it's a data URL (base64) or a file was selected
        // We handle upload via usePos which uses Firebase Storage
        const url = await uploadProductImage(
          productId,
          imagePreview,
          (progress) => {
            setUploadProgress(progress);
          },
        );
        toast.success("Image uploaded successfully");
        return url;
      } catch (e) {
        toast.error("Image upload failed");
        throw e;
      } finally {
        setIsUploading(false);
      }
    },
    [imagePreview, uploadProductImage],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">
                  Product Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., T-Shirt"
                    {...field}
                    className="h-11 font-bold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">
                  SKU
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., TSHIRT-BLK-LG"
                    {...field}
                    className="h-11 font-bold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">
                  Sale Price ($)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    className="h-11 font-bold text-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">
                  Cost Price ($)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    className="h-11 font-bold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">
                  Initial Stock
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    className="h-11 font-bold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taxRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">
                  Tax Rate (%)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    className="h-11 font-bold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <FormLabel className="text-[10px] font-black uppercase tracking-widest">
              Product Image
            </FormLabel>
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                type="button"
                variant={imageSource === "file" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-[9px] font-black uppercase px-2"
                onClick={() => setImageSource("file")}
              >
                <Upload className="h-3 w-3 mr-1" /> Upload
              </Button>
              <Button
                type="button"
                variant={imageSource === "url" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-[9px] font-black uppercase px-2"
                onClick={() => setImageSource("url")}
              >
                <LinkIcon className="h-3 w-3 mr-1" /> URL
              </Button>
            </div>
          </div>

          {imageSource === "file" ? (
            <div className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                  imagePreview
                    ? "border-primary/50 bg-primary/5"
                    : "border-border",
                )}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-lg group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ImagePlus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black uppercase">
                        Drop image here
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                        or click to browse files
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://example.com/image.png"
                        {...field}
                        className="h-11 pl-10 font-bold"
                        onChange={(e) => {
                          field.onChange(e);
                          setImagePreview(e.target.value);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isUploading ? (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading to Secure Storage...
                </span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          ) : (
            imagePreview && (
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-green-600 bg-green-500/10 p-2 rounded-lg animate-in zoom-in-95">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Image Ready for Catalog
              </div>
            )
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-black uppercase tracking-widest text-xs gap-2 shadow-lg mt-4"
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Securing Image..." : "Create Product"}
        </Button>
      </form>
    </Form>
  );
}