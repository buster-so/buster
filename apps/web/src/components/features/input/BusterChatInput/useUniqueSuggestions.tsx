import type { GetSuggestedPromptsResponse } from '@buster/server-shared/user';
import omit from 'lodash/omit';
import sampleSize from 'lodash/sampleSize';
import type React from 'react';
import { useMemo } from 'react';
import CircleQuestion from '@/components/ui/icons/NucleoIconOutlined/circle-question';
import FileSparkle from '@/components/ui/icons/NucleoIconOutlined/file-sparkle';
import type {
  MentionInputSuggestionsDropdownItem,
  MentionInputSuggestionsProps,
} from '@/components/ui/inputs/MentionInputSuggestions';
import { ASSET_ICONS } from '../../icons/assetIcons';

const iconRecord: Record<keyof GetSuggestedPromptsResponse['suggestedPrompts'], React.ReactNode> = {
  report: <FileSparkle />,
  dashboard: <ASSET_ICONS.dashboards />,
  visualization: <ASSET_ICONS.metrics />,
  help: <CircleQuestion />,
};

export const useUniqueSuggestions = (
  suggestedPrompts: GetSuggestedPromptsResponse['suggestedPrompts']
): MentionInputSuggestionsProps['suggestionItems'] => {
  return useMemo(() => {
    const filteredSuggestedPrompts = omit(suggestedPrompts, ['help']);
    const allSuggestions: { type: keyof typeof suggestedPrompts; value: string }[] = Object.entries(
      filteredSuggestedPrompts
    ).flatMap(([key, value]) => {
      return value.map((prompt) => {
        return {
          type: key as keyof typeof suggestedPrompts,
          value: prompt,
        };
      });
    });

    // Ensure we have at least 4 suggestions
    if (allSuggestions.length < 4) {
      throw new Error('Not enough suggestions available - need at least 4');
    }

    const fourUniqueSuggestions = sampleSize(allSuggestions, 4);

    const items: MentionInputSuggestionsDropdownItem[] = fourUniqueSuggestions.map((suggestion) => {
      const icon = iconRecord[suggestion.type] || <ASSET_ICONS.metircsAdd />;
      return {
        type: 'item',
        value: suggestion.type + suggestion.value,
        label: suggestion.value,
        icon,
      };
    });

    return [
      {
        type: 'group',
        label: 'Suggestions',
        suggestionItems: items,
        addValueToInput: true,
        closeOnSelect: true,
      },
    ] satisfies MentionInputSuggestionsProps['suggestionItems'];
  }, [suggestedPrompts]);
};
