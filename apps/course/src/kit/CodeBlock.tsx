import { Fragment, type CSSProperties } from 'react';
import { generate, parse, type ParseOptions } from 'sugar-high/core';
import * as css from 'sugar-high/lang/css';
import * as html from 'sugar-high/lang/html';
import * as shell from 'sugar-high/lang/shell';
import * as typescript from 'sugar-high/lang/typescript';

export type CodeLang = 'tsx' | 'ts' | 'css' | 'html' | 'bash';

const languages: Record<CodeLang, ParseOptions> = {
  tsx: typescript,
  ts: typescript,
  css,
  html: html as ParseOptions,
  bash: shell,
};

export function CodeBlock({ code, lang = 'tsx' }: { code: string; lang?: CodeLang }) {
  const lines = generate(parse(code.replace(/\n$/, ''), languages[lang]));

  return (
    <pre className="kit-code" tabIndex={0} data-lang={lang}>
      <code>
        {lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && '\n'}
            <span className="sh__line">
              {line.children.map((token, tokenIndex) => (
                <span
                  key={tokenIndex}
                  className={token.properties.className}
                  style={token.properties.style as CSSProperties}
                >
                  {token.children.map((text) => text.value).join('')}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </code>
    </pre>
  );
}
