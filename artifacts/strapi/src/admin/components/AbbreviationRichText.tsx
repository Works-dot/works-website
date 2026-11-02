import React, { forwardRef, useRef, useState } from "react";
import { Button, Dialog, Field, Flex, TextInput, Typography } from "@strapi/design-system";
// Resolved by admin/vite.config.ts to the installed Strapi editor, not a fork.
import { Wysiwyg } from "works-strapi-original-richtext";
import { abbreviationReplacement, abbreviationSelection, type AbbreviationSelection } from "./abbreviation-edit";

type Editor = {
  getValue(): string;
  getCursor(which: "from" | "to"): unknown;
  indexFromPos(pos: unknown): number;
  posFromIndex(index: number): unknown;
  replaceRange(text: string, from: unknown, to: unknown, origin: string): void;
  getOption(name: string): unknown;
  focus(): void;
};

export const AbbreviationRichText = forwardRef(function AbbreviationRichText(props: any, ref) {
  const container = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<{ editor: Editor; source: string; selection: AbbreviationSelection } | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const open = () => {
    const editor = (container.current?.querySelector(".CodeMirror") as (HTMLElement & { CodeMirror?: Editor }) | null)?.CodeMirror;
    if (!editor || props.disabled || editor.getOption("readOnly")) {
      setError("A rövidítéshez válts szerkesztési nézetre.");
      return;
    }
    const source = editor.getValue();
    const selection = abbreviationSelection(source, editor.indexFromPos(editor.getCursor("from")), editor.indexFromPos(editor.getCursor("to")));
    if (!selection.text.trim()) {
      setError("Előbb jelöld ki a rövidítést, vagy helyezd a kurzort egy már jelölt rövidítésbe.");
      return;
    }
    setError("");
    setTitle(selection.title);
    setEditing({ editor, source, selection });
  };
  const apply = (remove = false) => {
    if (!editing || props.disabled) return;
    try {
      if (editing.editor.getValue() !== editing.source) throw new Error("A szöveg közben megváltozott. Zárd be az ablakot és jelöld ki újra a rövidítést.");
      const replacement = abbreviationReplacement(editing.selection, title, remove);
      editing.editor.replaceRange(replacement, editing.editor.posFromIndex(editing.selection.from), editing.editor.posFromIndex(editing.selection.to), "+input");
      editing.editor.focus();
      setEditing(null);
      setError("");
    } catch (e) { setError((e as Error).message); }
  };
  // Only content blocks have the matching frontend Markdown renderer.
  // Do not offer this action on legacy richtext fields rendered as plain text.
  if (!/^contentBlocks\.\d+\.(body|quote)$/.test(props.name)) return <Wysiwyg {...props} ref={ref} />;
  return <div ref={container}>
    <Wysiwyg {...props} ref={ref} />
    <Flex paddingTop={2} gap={2} wrap="wrap">
      <Button type="button" variant="secondary" size="S" disabled={props.disabled} onMouseDown={(e: React.MouseEvent) => e.preventDefault()} onClick={open}>Rövidítés</Button>
      <Typography variant="pi" textColor="neutral600">Jelöld ki a rövidítést, majd add meg a feloldását.</Typography>
    </Flex>
    {!editing && error && <Typography role="alert" textColor="danger600">{error}</Typography>}
    <Dialog.Root open={!!editing} onOpenChange={(isOpen: boolean) => { if (!isOpen) { setEditing(null); setError(""); } }}>
      <Dialog.Content>
        <Dialog.Header>Rövidítés feloldása</Dialog.Header>
        <Dialog.Body>
          <Flex direction="column" alignItems="stretch" gap={4} width="100%">
            <Typography>Rövidítés: {editing?.selection.text}</Typography>
            <Field.Root name="abbreviation-title" error={error} required>
              <Field.Label>Feloldott alak</Field.Label>
              <TextInput value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="Web Content Accessibility Guidelines" />
              <Field.Error />
            </Field.Root>
            {editing?.selection.existing && <Button type="button" variant="danger-light" onClick={() => apply(true)}>Jelölés eltávolítása</Button>}
          </Flex>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Cancel><Button type="button" variant="tertiary">Mégse</Button></Dialog.Cancel>
          <Button type="button" onClick={() => apply()} disabled={!title.trim()}>Alkalmazás</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  </div>;
});
