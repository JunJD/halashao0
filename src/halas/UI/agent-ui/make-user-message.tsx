import type { UserMessageProps } from '@copilotkit/react-ui';
import { Copy } from 'lucide-react';
import styles from './index.module.scss';

export const MakeUserMessage = (props: UserMessageProps) => {
  const { message } = props;

  return (
    <div className={styles.userMessageContainer}>
      <div className={styles.userMessageHeader}>
        <div style={{ flex: 1 }} />
        <div
          className={styles.copyButton}
          onClick={() => {
            navigator.clipboard.writeText(message?.content ?? '');
          }}
        >
          <Copy size={14} color="#999" />
        </div>
      </div>

      <div className={styles.userMessageContent}>
        {message?.content}
      </div>
    </div>
  );
};