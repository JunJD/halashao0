import type { RenderSuggestionsListProps } from '@copilotkit/react-ui';
import { ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import styles from './index.module.scss';

export const RenderSuggestionsList: React.FC<RenderSuggestionsListProps> = (props) => {
  const { suggestions, onSuggestionClick } = props;

  return (
    <div className={styles.suggestionsContainer}>
      {/* Example: Task Completed Badge (Static for now, or driven by props if available) */}
      {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className={styles.taskCompleted}>
          <CheckCircle2 size={16} />
          Task Completed
        </div>
      </div> */}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#999', marginBottom: 8 }}>
          Suggestions
        </div>
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.title}
            className={styles.suggestionItem}
            onClick={() => {
              onSuggestionClick(suggestion.message);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={16} color="#999" />
              <span style={{ fontSize: 14, color: '#333' }}>
                {suggestion.title}
              </span>
            </div>
            <ArrowRight size={16} color="#ccc" />
          </div>
        ))}
      </div>
    </div>
  );
};