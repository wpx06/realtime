import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientDate } from "@/components/pages/clientDate";

export default function LeadDetailModal({ open, onClose, lead }: { open: boolean; onClose: () => void; lead: any }) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Lead</DialogTitle>
          <DialogDescription>Informasi lengkap dari klik user</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-3 text-sm text-zinc-800 dark:text-zinc-100">
            <div><strong>User ID:</strong> {lead.userId}</div>
            <div><strong>Country:</strong> {lead.country}</div>
            <div><strong>IP Address:</strong> {lead.ip}</div>
            <div><strong>Earning:</strong> ${lead.earning.toFixed(2)}</div>
            <div><strong>Device:</strong> {lead.useragent}</div>
            <div><strong>Time:</strong> <ClientDate date={lead.created_at} /></div>
          </div>
        </ScrollArea>
        <DialogClose asChild>
          <Button className="w-full mt-4" variant="secondary">Tutup</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
