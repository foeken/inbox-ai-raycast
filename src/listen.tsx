import { ActionPanel, Action, Icon,List, showToast, Toast, open } from "@raycast/api";
import { useState, useEffect } from "react";
import { homedir } from "os";
import * as plist from "plist";
import { readFileSync } from "fs";
import { execSync } from "child_process";

interface ActionVariable {
  id: string;
  name: string;
  required: boolean;
  label: string;
  description: string;
  value: string;
  ai: boolean;
  type: string;
}

interface SavedAction {
  id: string;
  displayName: string;
  description: string;
  identifier: string;
  type: string;
  icon: string;
  variables: ActionVariable[];
  instructions: string;
}

interface PlistData {
  savedActions: SavedAction[];  
}

function readPlistFile() {
  try {
    const plistPath = `${homedir()}/Library/Group Containers/6DA7MK99T2.com.dreetje.InboxAI.group/Library/Preferences/6DA7MK99T2.com.dreetje.InboxAI.group.plist`;
    
    // Convert binary plist to XML format using plutil
    const xmlContent = execSync(`plutil -convert xml1 -o - "${plistPath}"`).toString();
    const parsedData = plist.parse(xmlContent) as any;
    
    // Parse the savedActions buffer if it exists
    if (parsedData && parsedData.savedActions && Buffer.isBuffer(parsedData.savedActions)) {
      try {
        parsedData.savedActions = JSON.parse(parsedData.savedActions.toString());
      } catch (e) {
        console.error('Failed to parse savedActions:', e);
        return null;
      }
    }
    
    if (!parsedData || !Array.isArray(parsedData.savedActions)) {
      console.error('Invalid plist data structure:', parsedData);
      return null;
    }
    
    return parsedData as PlistData;
  } catch (error) {
    console.error('Error reading plist file:', error);
    return null;
  }
}

const getIconForName = (name: string): Icon => {
  const iconMap: { [key: string]: Icon } = {
    'waveform': Icon.Microphone,
    'doc.on.clipboard': Icon.Clipboard,
    'bubble.left.and.text.bubble.right': Icon.Message,
    'envelope': Icon.Envelope,
    'folder': Icon.Folder,
    'macwindow.and.cursorarrow': Icon.Window,
    'applescript': Icon.Terminal,
    'text.badge.checkmark': Icon.CheckCircle,
    'mail': Icon.Envelope,
    'bell': Icon.Bell,
    'clipboard': Icon.Clipboard,
    'list.bullet': Icon.List,
    'text.insert': Icon.Text,
    'text.cursor': Icon.Text,
    'camera': Icon.Camera,
    'arrow.uturn.left': Icon.ArrowLeftCircle,
    'text.bubble': Icon.Message,
    'brain': Icon.Stars,
    'questionmark.bubble': Icon.QuestionMark,
    'doc.text.magnifyingglass': Icon.MagnifyingGlass,
    'message.badge.waveform': Icon.Microphone,
    'note.text.badge.plus': Icon.Plus,
    'checklist.unchecked': Icon.Checkmark,
    'list.bullet.indent': Icon.List,
    'network': Icon.Globe,
    'calendar': Icon.Calendar,
    'link': Icon.Link,
    'square.and.pencil': Icon.Pencil,
    'envelope.arrow.triangle.branch': Icon.Envelope,
    'arrow.trianglehead.branch': Icon.ArrowRight
  };
  return iconMap[name] || Icon.Circle;
};

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

  const filteredActions = plistData?.savedActions?.filter(action => {    
    // Log all unique icons
    console.log(`Action: ${action.displayName}, Type: ${action.type}, Icon: ${action.icon}`);
    return (action.type === 'askAI' || action.type === 'realtimeAI') &&
    (action.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
    action.description.toLowerCase().includes(searchText.toLowerCase()))
  }) || [];

  const triggerVoiceInput = async (action: SavedAction) => {
    try {
      const url = `inboxai://audio?action=${encodeURIComponent(action.id)}`;
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
                  title={`Listen for ${action.displayName}`}
                  onAction={() => triggerVoiceInput(action)}
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
