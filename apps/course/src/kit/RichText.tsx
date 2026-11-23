const tokenPattern = /(`[^`]+`|\*\*[^*]+\*\*)/;

export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(tokenPattern).map((part, index) => {
        if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={index} className="kit-inline-code">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </>
  );
}
