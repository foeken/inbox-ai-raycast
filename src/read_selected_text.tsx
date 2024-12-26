import { ActionPanel, Action, List, showToast, Toast, open, getSelectedText, LaunchProps } from "@raycast/api";
import { createDeeplink, DeeplinkType } from "@raycast/utils";
import { useState, useEffect } from "react";
import { PlistData, SavedAction, readPlistFile, getIconForName, filterActions } from "./actions";

interface CommandContext {
  actionId?: string;
  originalInput?: string;
}

export default function Command(props: LaunchProps<{ launchContext: CommandContext }>) {
  const [plistData, setPlistData] = useState<PlistData | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const data = readPlistFile();
    if (data) {
      setPlistData(data);
      // If we have a context with actionId, try to find and execute that action
      const context = props.launchContext;
      if (context?.actionId && context?.originalInput) {
        const action = data.savedActions.find(a => a.id === context.actionId);
        if (action) {
          const url = `inboxai://execute?action=${encodeURIComponent(action.id)}&originalInput=${encodeURIComponent(context.originalInput)}`;
          open(url);
        }
      }
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Could not read Inbox AI preferences",
      });
    }
  }, [props.launchContext]);

  const filteredActions = filterActions(plistData?.savedActions, searchText, ['askAI']);

  const triggerWithSelectedText = async (action: SavedAction) => {
    try {
      const selectedText = await getSelectedText().catch(() => null);
      if (!selectedText) {
        showToast({
          style: Toast.Style.Failure,
          title: "No Text Selected",
          message: "Please select some text first",
        });
        return;
      }
      
      const url = `inboxai://execute?action=${encodeURIComponent(action.id)}&originalInput=${encodeURIComponent(selectedText)}`;
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
            accessories={[{ text: 'Ask AI' }]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title={`Read Selected Text with ${action.displayName}`}
                    onAction={() => triggerWithSelectedText(action)}
                  />
                  <Action.CreateQuicklink
                    title="Create Quick Link"
                    quicklink={{
                      name: action.displayName,
                      link: createDeeplink({
                        command: "read_selected_text",
                        context: {
                          actionId: action.id
                        }
                      })
                    }}
                    shortcut={{ modifiers: ["cmd"], key: "." }}
                  />
                </ActionPanel.Section>
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