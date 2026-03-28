"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePos } from '@/hooks/use-pos';

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  basePrice: z.coerce.number().min(0, 'Base price must be a positive number'),
  costPrice: z.coerce.number().min(0, 'Cost price must be a positive number'),
  stockQuantity: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock must be a positive number'),
  taxRate: z.coerce.number().min(0, 'Tax rate must be a positive number'),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

interface AddItemFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}

export function AddItemForm({ onSubmit }: AddItemFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      sku: '',
      basePrice: 0,
      costPrice: 0,
      stockQuantity: 0,
      taxRate: 0,
      imageUrl: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., T-Shirt" {...field} />
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
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="e.g., TSHIRT-BLK-LG" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Price</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 29.99" {...field} />
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
              <FormLabel>Cost Price</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 12.50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stockQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Quantity</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 100" {...field} />
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
              <FormLabel>Tax Rate (%)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 8" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="e.g., https://example.com/image.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Add Product</Button>
      </form>
    </Form>
  );
}
