"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCRM } from "@/hooks/use-crm";

const logCallSchema = z.object({
  type: z.enum(["Incoming", "Outgoing"]),
  from: z.string().optional(),
  to: z.string().optional(),
  duration: z.coerce.number().min(0, "Duration must be positive"),
  status: z.enum(["initiated", "ringing", "in-progress", "completed", "failed", "busy", "no-answer", "queued", "canceled"]),
  summary: z.string().min(1, "Summary is required"),
  related_to: z.string().optional(),
});

interface LogCallFormProps {
  initialData?: Partial<z.infer<typeof logCallSchema>>;
  onSubmit: (data: z.infer<typeof logCallSchema>) => void;
  onCancel: () => void;
}

export function LogCallForm({ initialData, onSubmit, onCancel }: LogCallFormProps) {
  const { leads } = useCRM();
  const form = useForm<z.infer<typeof logCallSchema>>({
    resolver: zodResolver(logCallSchema),
    defaultValues: {
      type: initialData?.type || "Outgoing",
      from: initialData?.from || "",
      to: initialData?.to || "",
      duration: initialData?.duration || 0,
      status: initialData?.status || "completed",
      summary: initialData?.summary || "",
      related_to: initialData?.related_to || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl bg-secondary/30">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Incoming">Incoming</SelectItem>
                    <SelectItem value="Outgoing">Outgoing</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl bg-secondary/30">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="ringing">Ringing</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="no-answer">No Answer</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From</FormLabel>
                <FormControl>
                  <Input {...field} className="rounded-xl bg-secondary/30" placeholder="Source number..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To</FormLabel>
                <FormControl>
                  <Input {...field} className="rounded-xl bg-secondary/30" placeholder="Destination number..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (sec)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="rounded-xl bg-secondary/30" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="related_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related To</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl bg-secondary/30">
                      <SelectValue placeholder="Select lead..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.name}>{lead.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Discussed pricing and next steps..." 
                  className="resize-none rounded-xl bg-secondary/30 min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Log Call</Button>
        </div>
      </form>
    </Form>
  );
}
