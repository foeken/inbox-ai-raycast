import { ActionPanel, Action, List, showToast, Toast, open } from "@raycast/api";
import { useState, useEffect } from "react";
import { PlistData, SavedAction, readPlistFile, getIconForName, filterActions } from "./actions";

export default function Command() {
  const [plistData, setPlistData] = useState<PlistData | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const data = readPlistFile();
    if (data) {
      setPlistData(data);
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Could not read Inbox AI preferences",
      });
    }
  }, []);

  const filteredActions = filterActions(plistData?.savedActions, searchText, ['askAI']);

  const triggerScreenshot = async (action: SavedAction) => {
    try {
      const url = `inboxai://screenshot?action=${encodeURIComponent(action.id)}`;
      await open(url);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to launch Inbox AI. Is it installed?",
      });
    }
  };

  return (
    <List
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search actions..."
    >
      <List.Section title="Available Actions">
        {filteredActions.map((action) => (
          <List.Item
            key={action.id}
            title={action.displayName}
            subtitle={action.description}
            icon={{ source: getIconForName(action.icon) }}
            accessories={[{ text: action.type === 'askAI' ? 'Ask AI' : 'AI Conversation' }]}
            actions={
              <ActionPanel>
                <Action
                  title={`Look for ${action.displayName}`}
                  onAction={() => triggerScreenshot(action)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

// Add this at the top level of the file to help with debugging
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
}); 