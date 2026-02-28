import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './dialog';
import { Button } from './button';
import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Confirmar',
  description = '¿Está seguro que desea continuar?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="mb-4 text-gray-700">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
          <Button variant="success" onClick={onConfirm}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
