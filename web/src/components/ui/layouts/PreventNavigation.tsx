'use client';

import { useMemoizedFn, useMount, useUnmount } from '@/hooks';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useMemo } from 'react';
import React from 'react';
import { AppModal } from '../modal/AppModal';

type PreventNavigationProps = {
  isDirty: boolean;
  title: string;
  description: string;
  cancelText?: string;
  okText?: string;
  onOk: (() => Promise<void>) | (() => void);
  onCancel: (() => Promise<void>) | (() => void);
  onClose?: (() => Promise<void>) | (() => void);
};

export const PreventNavigation: React.FC<PreventNavigationProps> = React.memo(
  ({ isDirty, cancelText = 'Discard changes', okText = 'Save changes', ...props }) => {
    const [canceling, setCanceling] = useState(false);
    const [okaying, setOkaying] = useState(false);
    const [leavingPage, setLeavingPage] = useState(false);
    const router = useRouter();
    /**
     * Function that will be called when the user selects `yes` in the confirmation modal,
     * redirected to the selected page.
     */
    const confirmationFn = useRef<() => void>(() => {});

    // Used to make popstate event trigger when back button is clicked.
    // Without this, the popstate event will not fire because it needs there to be a href to return.

    /**
     * Used to prevent navigation when use click in navigation `<Link />` or `<a />`.
     * @param e The triggered event.
     */
    const handleClick = useMemoizedFn((event: MouseEvent) => {
      const originalTarget = event.target as HTMLElement;
      const originalEvent = event;

      const newEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: originalEvent.detail,
        screenX: originalEvent.screenX,
        screenY: originalEvent.screenY,
        clientX: originalEvent.clientX,
        clientY: originalEvent.clientY,
        ctrlKey: originalEvent.ctrlKey,
        altKey: originalEvent.altKey,
        shiftKey: originalEvent.shiftKey,
        metaKey: originalEvent.metaKey,
        button: originalEvent.button,
        buttons: originalEvent.buttons
      });

      if (isDirty) {
        event.preventDefault();
        event.stopPropagation();

        // Store both the target and the original event details
        confirmationFn.current = () => {
          // Remove all click listeners temporarily
          document.querySelectorAll('a').forEach((link) => {
            link.removeEventListener('click', handleClick);
          });

          // Get all click event handlers on the original target
          const clickHandlers = originalTarget.onclick;

          // Temporarily remove our prevention
          if (clickHandlers) {
            originalTarget.onclick = null;
          }

          // Dispatch the event directly on the original target
          originalTarget.dispatchEvent(newEvent);

          // Restore click handlers
          if (clickHandlers) {
            originalTarget.onclick = clickHandlers;
          }
        };

        setLeavingPage(true);
      } else {
        document.querySelectorAll('a').forEach((link) => {
          link.removeEventListener('click', handleClick);
        });
        originalTarget.dispatchEvent(newEvent);
      }
    });

    /**
     * Used to prevent navigation when use `back` browser buttons.
     */
    const handlePopState = useMemoizedFn(() => {
      if (isDirty) {
        window.history.pushState(null, document.title, window.location.href);

        confirmationFn.current = () => {
          router.back();
        };

        setLeavingPage(true);
      } else {
        window.history.back();
      }
    });

    /**
     * Used to prevent navigation when reload page or navigate to another page, in diffenret origin.
     * @param e The triggered event.
     */
    const handleBeforeUnload = useMemoizedFn((e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = true;
      }
    });

    useEffect(() => {
      /* *************************** Open listeners ************************** */
      document.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', handleClick);
      });
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);

      /* ************** Return from useEffect closing listeners ************** */
      return () => {
        document.querySelectorAll('a').forEach((link) => {
          link.removeEventListener('click', handleClick);
        });
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }, [isDirty]);

    const onClose = useMemoizedFn(async () => {
      setLeavingPage(false);
      await props.onClose?.();
      confirmationFn.current = () => {};
    });

    const noCallback = useMemoizedFn(async () => {
      setCanceling(true);
      setLeavingPage(false);
      await props.onCancel?.();
      confirmationFn.current();
      confirmationFn.current = () => {};
      setCanceling(false);
    });

    const yesCallback = useMemoizedFn(async () => {
      setOkaying(true);
      setLeavingPage(false);
      await props.onOk?.();
      confirmationFn.current();
      confirmationFn.current = () => {};
      setOkaying(false);
    });

    useMount(() => {
      window.history.pushState(null, document.title, window.location.href);
    });

    if (!isDirty) return null;

    return (
      <>
        <LeavingDialog
          {...props}
          canceling={canceling}
          okaying={okaying}
          cancelText={cancelText}
          okText={okText}
          isOpen={leavingPage}
          onClose={onClose}
          noCallback={noCallback}
          yesCallback={yesCallback}
        />
      </>
    );
  }
);

PreventNavigation.displayName = 'PreventNavigation';

const LeavingDialog: React.FC<{
  isOpen: boolean;
  noCallback: () => void;
  yesCallback: () => void;
  onClose: () => void;
  title: string;
  description: string;
  cancelText: string;
  okText: string;
  canceling: boolean;
  okaying: boolean;
}> = React.memo(
  ({
    onClose,
    isOpen,
    okaying,
    canceling,
    noCallback,
    yesCallback,
    title,
    description,
    okText,
    cancelText
  }) => {
    const disableButtons = okaying || canceling;

    const memoizedHeader = useMemo(() => {
      return { title, description };
    }, [title, description]);

    const memoizedFooter = useMemo(() => {
      return {
        primaryButton: {
          text: cancelText,
          onClick: noCallback,
          loading: canceling,
          disabled: disableButtons
        },
        secondaryButton: {
          text: okText,
          onClick: yesCallback,
          loading: okaying,
          disabled: disableButtons
        }
      };
    }, [okaying, canceling, disableButtons, noCallback, yesCallback, cancelText, okText]);

    return (
      <>
        <AppModal open={isOpen} onClose={onClose} header={memoizedHeader} footer={memoizedFooter} />
      </>
    );
  }
);

LeavingDialog.displayName = 'LeavingDialog';
