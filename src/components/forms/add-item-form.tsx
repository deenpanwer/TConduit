"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useForm, useFormState } from "react-hook-form";
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
import { usePos, Product as ProductType } from "@/hooks/use-pos";
import { useAuth } from "@/hooks/use-auth";
import {
  ImagePlus,
  Loader2,
  X,
  CheckCircle2,
  Link as LinkIcon,
  Upload,
  Sparkles,
  Dices,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ImageBrowser } from "@/components/ui/ImageBrowser";
import JsBarcode from "jsbarcode";

const formSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  basePrice: z.coerce.number().min(0, "Base price must be 0 or positive"),
  costPrice: z.coerce.number().min(0, "Cost price must be 0 or positive"),
  stockQuantity: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock must be 0 or positive"),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative"),
  imageUrl: z.string().optional().or(z.literal("")),
});

interface AddItemFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void | string>;
  product?: ProductType;
}

function BarcodeDisplay({ value }: { value: string }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: "CODE128",
          width: 1.2,
          height: 30,
          displayValue: false,
          margin: 0,
          background: "transparent",
          lineColor: "currentColor",
        });
      } catch (e) {
        // Handle invalid barcode chars
      }
    }
  }, [value]);

  if (!value) return null;

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-secondary/20 rounded-lg border border-border/50 mt-1 animate-in fade-in zoom-in-95">
      <svg ref={barcodeRef} className="text-foreground opacity-70" />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-50">{value}</span>
    </div>
  );
}

export function AddItemForm({ onSubmit, product }: AddItemFormProps) {
  const { uploadProductImage, config } = usePos();
  const { userData, user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<"url" | "file" | "browse">("browse");
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      basePrice: 0,
      costPrice: 0,
      stockQuantity: 0,
      taxRate: (config as any)?.defaultTaxRate || 0,
      imageUrl: "",
    },
  });

  const currency = (config as any)?.currency || "$";

  const { errors } = useFormState({ control: form.control });

  useEffect(() => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstError = errors[errorKeys[0] as keyof typeof errors];
      if (firstError?.message) {
        toast.error(firstError.message as string);
      }
    }
  }, [errors]);

  // Sync form with product prop when it changes (for editing)
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        basePrice: product.basePrice,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        taxRate: product.taxRate,
        imageUrl: product.imageUrl || "",
      });
      setImagePreview(product.imageUrl || null);
      if (product.imageUrl?.startsWith("https://images.unsplash.com")) {
        setImageSource("browse");
      } else if (product.imageUrl) {
        setImageSource("url");
      } else {
        setImageSource("file");
      }
    } else {
      form.reset({
        name: "",
        sku: "",
        basePrice: 0,
        costPrice: 0,
        stockQuantity: 0,
        taxRate: config?.defaultTaxRate || 0,
        imageUrl: "",
      });
      setImagePreview(null);
      setImageSource("browse");
    }
  }, [product, form, config?.defaultTaxRate]);

  const generateSku = () => {
    const orgName = (userData as any)?.orgName || "TRAC";
    const prefix = orgName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    const random = Math.floor(100000 + Math.random() * 900000);
    const newSku = `${prefix}-${random}`;
    form.setValue("sku", newSku, { shouldValidate: true });
    toast.success("SKU Generated");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processSubmit = async (values: z.infer<typeof formSchema>) => {
    const orgId = (userData as any)?.orgId || (userData as any)?.ownedOrgId;
    if (!user || !orgId) {
      toast.error("Authentication required to save products");
      return;
    }

    try {
      // 1. Create/Update product first to get ID
      const result = await onSubmit(values);
      const productId = product?.id || (result as string);

      if (!productId) {
        throw new Error("Product operation failed");
      }

      // 2. If there's a file image preview (newly selected), upload it
      if (
        imageSource === "file" &&
        imagePreview &&
        imagePreview.startsWith("data:")
      ) {
        setIsUploading(true);
        try {
          await uploadProductImage(
            productId,
            imagePreview,
            (progress) => {
              setUploadProgress(progress);
            },
          );
          toast.success("Image secured to storage");
        } catch (e) {
          toast.error("Cloud storage upload failed");
          console.error(e);
        } finally {
          setIsUploading(false);
        }
      }

      if (!product) {
        form.reset();
        setImagePreview(null);
        setSearchTerm("");
      }
      setUploadProgress(0);
    } catch (error) {
      console.error("Submit error", error);
      toast.error("Failed to save product");
    }
  };

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
                    onChange={(e) => {
                      field.onChange(e);
                      setSearchTerm(e.target.value);
                    }}
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
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="e.g., TSHIRT-BLK-LG"
                        {...field}
                        className="h-11 font-bold pr-12"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={generateSku}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-secondary rounded-lg transition-colors text-primary"
                      title="Auto-generate SKU"
                    >
                      <Dices size={18} />
                    </button>
                  </div>
                  <BarcodeDisplay value={field.value} />
                </div>
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
                  Sale Price ({currency})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    min="0"
                    step="0.01"
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
                  Cost Price ({currency})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    min="0"
                    step="0.01"
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
                  Current Stock
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    min="0"
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
                    min="0"
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
                variant={imageSource === "browse" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-[9px] font-black uppercase px-2"
                onClick={() => setImageSource("browse")}
              >
                <Sparkles className="h-3 w-3 mr-1" /> Magic
              </Button>
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

          {imageSource === "browse" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <ImageBrowser 
                query={searchTerm} 
                onSelect={(url) => {
                  setImagePreview(url);
                  form.setValue("imageUrl", url);
                }} 
                selectedUrl={imagePreview}
              />
            </div>
          )}

          {imageSource === "file" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
          )}

          {imageSource === "url" && (
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-500">
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
          {isUploading ? (product ? "Saving Changes..." : "Securing Image...") : (product ? "Update Product" : "Create Product")}
        </Button>
      </form>
    </Form>
  );
}
