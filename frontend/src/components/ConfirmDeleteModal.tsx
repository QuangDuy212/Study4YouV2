import { Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemName?: string;
  title?: string;
  description?: React.ReactNode;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  title,
  description,
  isLoading = false,
  confirmText,
  cancelText,
}: ConfirmDeleteModalProps) {
  const { t } = useLanguage();

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  const descTemplate = t("confirmDeleteDesc") || "Bạn có chắc chắn muốn xóa vĩnh viễn {name} khỏi hệ thống không?";
  const descParts = descTemplate.split("{name}");
  const noun = t("deleteItemNoun") || "mục này";

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent className="rounded-2xl border border-destructive/20 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden sm:max-w-[440px]">
        <AlertDialogHeader className="space-y-4 pt-2">
          <AlertDialogTitle className="text-xl font-bold flex items-center gap-3 text-destructive/90">
            <div className="p-2.5 bg-destructive/10 rounded-xl ring-1 ring-destructive/20 flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            {title || t("confirmDeleteTitle") || "Xác nhận xóa?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground/90 leading-relaxed">
            {description ? (
              description
            ) : (
              <>
                {descParts[0]}
                <strong className="font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60 inline-block my-0.5 mx-0.5">
                  {itemName || noun}
                </strong>
                {descParts[1]}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3 sm:gap-0 bg-muted/20 -mx-6 -mb-6 p-6 border-t border-border/20 flex sm:justify-end">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-5 h-11 border-border/60 font-semibold hover:bg-muted/80 transition-all flex-1 sm:flex-none"
          >
            {cancelText || t("cancel") || "Hủy"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="rounded-xl px-6 h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 hover:shadow-destructive/30 transition-all flex-1 sm:flex-none min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t("processing") || "Đang xử lý..."}
              </>
            ) : (
              confirmText || t("confirmDeleteAction") || "Xóa ngay"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
