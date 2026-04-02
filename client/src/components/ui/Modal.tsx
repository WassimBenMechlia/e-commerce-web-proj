import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { Button } from './Button';
import { Card } from './Card';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
}

export const Modal = ({
  open,
  title,
  onClose,
  children,
}: PropsWithChildren<ModalProps>) => (
  <AnimatePresence>
    {open ? (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/45 px-4 py-10 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          onClick={(event) => event.stopPropagation()}
        >
          <Card className="w-full max-w-2xl p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
                  Editor
                </p>
                <h3 className="font-heading text-2xl text-text-primary">{title}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {children}
          </Card>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);
