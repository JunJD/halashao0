import type { InputProps } from '@copilotkit/react-ui';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Square } from 'lucide-react';
import styles from './index.module.scss';
import { cn } from '@/utils/cn';

export const MakeInput: React.FC<InputProps> = (props) => {
  const { inProgress, onSend: propOnSend, onStop } = props;

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(45);

  const streaming = inProgress || sending;

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    textareaRef.current?.focus();
  }, []);

  const updateTextAreaHeight = useCallback(() => {
    const maxHeight = 120;
    const target = textareaRef.current;
    if (!target) return;
    target.style.height = 'auto';
    const height = Math.min(target.scrollHeight, maxHeight);
    target.style.height = `${height}px`;
    target.style.overflowY = 'auto';
    setTextareaHeight(height);
  }, []);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateTextAreaHeight();
      setInput(e.currentTarget.value);
    },
    [updateTextAreaHeight],
  );

  const handleSend = useCallback(
    async (message?: string) => {
      const messageToSend = message ?? input;
      if (!messageToSend.trim() || streaming) return;

      setSending(true);
      setInput('');
      setTimeout(() => {
        updateTextAreaHeight();
      }, 0);

      try {
        await propOnSend(messageToSend);
      } finally {
        setSending(false);
      }
    },
    [input, propOnSend, streaming, updateTextAreaHeight],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Support Shift+Enter for new line
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        const isEmpty = e.currentTarget.value.trim() === '';
        if (!isEmpty && !streaming) {
          e.currentTarget.blur();
          void handleSend();
        }
      }
    },
    [handleSend, streaming],
  );

  useEffect(() => {
    updateTextAreaHeight();
  }, [updateTextAreaHeight]);

  return (
    <div
      className={styles.inputContainer}
      onClick={onClick}
    >
      <div style={{ width: '100%' }}>
        <motion.div
          layout
          animate={{ height: textareaHeight }}
          transition={{ duration: 0.13, ease: 'easeOut' }}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            name="chat-input"
            rows={1}
            disabled={streaming}
            placeholder="What do you want to create?"
            className={styles.inputTextArea}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
          />
        </motion.div>
      </div>
      <footer className={styles.inputFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {streaming ? (
            <button
              className={cn(styles.sendButton, styles.stop)}
              aria-label="Stop generation"
              onClick={onStop}
            >
              <Square size={14} color="#fff" fill="#fff" />
            </button>
          ) : (
            <button
              disabled={!input.trim() || sending}
              className={cn(styles.sendButton, (!input.trim() || sending) ? '' : styles.active)}
              aria-label="Send message"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleSend();
              }}
            >
              <Send size={16} color="#fff" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};