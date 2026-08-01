import React from 'react';
import { motion, PanInfo } from 'motion/react';

export interface SwipeableContainerProps {
  onClose: () => void;
  children: React.ReactNode;
  direction?: 'down' | 'right' | 'left';
  className?: string;
  showHandle?: boolean;
  handleClassName?: string;
  backdropClassName?: string;
  closeOnBackdropClick?: boolean;
  id?: string;
}

export const SwipeableContainer: React.FC<SwipeableContainerProps> = ({
  onClose,
  children,
  direction = 'down',
  className = '',
  showHandle = true,
  handleClassName = '',
  backdropClassName = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4',
  closeOnBackdropClick = true,
  id,
}) => {
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (direction === 'down') {
      if (info.offset.y > 70 || info.velocity.y > 250) {
        onClose();
      }
    } else if (direction === 'right') {
      if (info.offset.x > 70 || info.velocity.x > 250) {
        onClose();
      }
    } else if (direction === 'left') {
      if (info.offset.x < -70 || info.velocity.x < -250) {
        onClose();
      }
    }
  };

  const isVertical = direction === 'down';
  const dragAxis = isVertical ? 'y' : 'x';

  return (
    <motion.div
      key="swipeable-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={backdropClassName}
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        id={id}
        drag={dragAxis}
        dragConstraints={
          isVertical
            ? { top: 0, bottom: 0 }
            : direction === 'right'
            ? { left: 0, right: 0 }
            : { left: 0, right: 0 }
        }
        dragElastic={0.35}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        initial={
          isVertical
            ? { opacity: 0, y: 24, scale: 0.96 }
            : direction === 'right'
            ? { opacity: 0, x: '100%' }
            : { opacity: 0, x: '-100%' }
        }
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        exit={
          isVertical
            ? { opacity: 0, y: 24, scale: 0.96 }
            : direction === 'right'
            ? { opacity: 0, x: '100%' }
            : { opacity: 0, x: '-100%' }
        }
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative cursor-grab active:cursor-grabbing ${className}`}
      >
        {showHandle && (
          <div className={`w-full flex justify-center py-1.5 touch-none select-none ${handleClassName}`}>
            <div className="w-12 h-1.5 bg-slate-700/80 hover:bg-slate-500 rounded-full transition-colors shadow-inner" />
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
};
