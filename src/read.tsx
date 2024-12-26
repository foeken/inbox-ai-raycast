import { ActionPanel, Action, List, showToast, Toast, open, getSelectedText, Form } from "@raycast/api";
import { useState, useEffect } from "react";
import { PlistData, SavedAction, readPlistFile, getIconForName, filterActions } from "./actions";

export default function Command() {
  const [plistData, setPlistData] = useState<PlistData | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showTextForm, setShowTextForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<SavedAction | null>(null);

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

  const triggerWithSelectedText = async (action: SavedAction) => {
    try {
      const selectedText = await getSelectedText().catch(() => null);
      if (!selectedText) {
        setSelectedAction(action);
        setShowTextForm(true);
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

  const handleSubmit = async (values: Record<string, string>) => {
    if (!selectedAction) return;
    
    try {
      const params = new URLSearchParams();
      params.append('action', selectedAction.id);

      // Add all form values as parameters
      Object.entries(values).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          if (key === 'text') {
            params.append('originalInput', value);
          } else {
            params.append(key, value);
          }
        }
      });

      const url = `inboxai://execute?${params.toString()}`;
      await open(url);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to launch Inbox AI. Is it installed?",
      });
    }
  };

  if (showTextForm && selectedAction) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
          </ActionPanel>
        }
      >
        <Form.TextArea
          id="text"
          title="Input"
          placeholder="Enter the import for the action here"
          enableMarkdown={false}
          autoFocus          
        />
        {selectedAction.variables
          .filter(v => v.ai)
          .map(variable => (
            <Form.TextField
              key={variable.id}
              id={variable.id}
              title={variable.label}
              placeholder={variable.description}
              defaultValue={variable.value}              
            />
          ))}
      </Form>
    );
  }

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
                <Action
                  title={`Read for ${action.displayName}`}
                  onAction={() => triggerWithSelectedText(action)}
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