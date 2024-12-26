import { ActionPanel, Action, List, showToast, Toast, open, Form, LaunchProps } from "@raycast/api";
import { useState, useEffect } from "react";
import { PlistData, SavedAction, readPlistFile, getIconForName, filterActions } from "./actions";

interface CommandContext {
  actionId?: string;
  variables?: Record<string, string>;
}

export default function Command(props: LaunchProps<{ launchContext: CommandContext }>) {
  const [plistData, setPlistData] = useState<PlistData | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showTextForm, setShowTextForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<SavedAction | null>(null);

  useEffect(() => {
    const data = readPlistFile();
    if (data) {
      setPlistData(data);
      // If we have a context with actionId, show form for that action
      const context = props.launchContext;
      if (context?.actionId) {
        const action = data.savedActions.find(a => a.id === context.actionId);
        if (action) {
          setSelectedAction(action);
          setShowTextForm(true);
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
          placeholder="The input for the AI action"
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
                <ActionPanel.Section>
                  <Action
                    title={`Execute ${action.displayName}`}
                    onAction={() => {
                      setSelectedAction(action);
                      setShowTextForm(true);
                    }}
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