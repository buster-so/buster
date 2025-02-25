import { ApiSessionWithTraces } from 'langfuse';
import React, { useMemo } from 'react';
import 'react-json-view-lite/dist/index.css';
import { Card, Typography, Collapse, theme } from 'antd';
import { createStyles } from 'antd-style';
import { DownOutlined } from '@ant-design/icons';

type LangfuseUserMessage = {
  content: string;
  role: 'user';
};
type LangfuseAssistantMessage = {
  role: 'assistant';
  name: string;
  tool_calls: [
    {
      id: string;
      type: 'function';
      function: {
        name: string;
        arguments: string;
      };
    }
  ];
};
type LangfuseDeveloperMessage = {
  role: 'developer';
  content: string;
};
type LangfuseToolMessage = {
  role: 'tool';
  content: string;
  tool_call_id: string;
  name: string;
};

type LangfuseMessage =
  | LangfuseUserMessage
  | LangfuseAssistantMessage
  | LangfuseDeveloperMessage
  | LangfuseToolMessage;

type LangfuseTool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    strict: boolean;
    parameters: {
      type: 'object';
      required: string[];
      properties: {
        [key: string]: {
          type: 'string';
          description: string;
        };
      };
      additionalProperties: false;
    };
  };
};

const useStyles = createStyles(({ token }) => ({
  functionCall: {
    marginBottom: token.marginMD,
    '&:last-child': {
      marginBottom: 0
    }
  },
  functionName: {
    color: token.colorPrimary,
    fontSize: token.fontSizeLG,
    fontWeight: token.fontWeightStrong,
    marginBottom: token.marginXS
  },
  argumentsLabel: {
    color: token.colorTextSecondary,
    fontWeight: token.fontWeightStrong,
    marginBottom: token.marginXS
  },
  codeBlock: {
    background: token.colorFillTertiary,
    borderRadius: token.borderRadiusLG,
    padding: token.padding,
    fontSize: token.fontSize,
    fontFamily: token.fontFamilyCode,
    border: `0.5px solid ${token.colorBorder}`,
    maxHeight: '400px',
    overflow: 'auto'
  },
  simpleArgument: {
    marginLeft: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSize
  }
}));

export const TracesIndividualContent = React.memo(({ trace }: { trace: ApiSessionWithTraces }) => {
  const traces = trace.traces;

  return (
    <div className="h-full gap-y-3 space-y-3 overflow-y-auto p-8">
      {traces.map((trace, index) => {
        const input = trace.input as {
          messages: LangfuseMessage[];
          tools: LangfuseTool[];
        };

        return (
          <React.Fragment key={index}>
            {input.messages.map((message, index) => {
              return (
                <React.Fragment key={index}>
                  {message.role === 'user' && <UserMessage message={message} />}
                  {message.role === 'assistant' && <AssistantMessage message={message} />}
                  {message.role === 'tool' && <ToolMessage message={message} />}
                  {message.role === 'developer' && <DeveloperMessage message={message} />}
                </React.Fragment>
              );
            })}

            <div className="my-3 flex flex-col items-center justify-center gap-2 rounded-lg border-[0.5px] border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="text-sm font-medium text-purple-700">Message Gap</div>
              <span className="text-sm font-medium text-purple-700">
                {input.tools?.length || 0}{' '}
                {(input.tools?.length || 0) === 1 ? 'Tool' : 'Tools'}{' '}
              </span>
            </div>

            {input.tools?.map((tool, index) => {
              return <ToolCard key={index + 'tool'} tool={tool} />;
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
});

const MessageCard: React.FC<{
  title: string;
  content: string | React.ReactNode;
  variant?: 'user' | 'developer' | 'tool' | 'assistant';
}> = ({ title, content, variant = 'user' }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > 250);
    }
  }, [content]);

  const variantStyles = {
    user: 'from-blue-50 to-blue-100 border-blue-200',
    developer: 'from-amber-50 to-amber-100 border-amber-200',
    tool: 'from-emerald-50 to-emerald-100 border-emerald-200',
    assistant: 'from-indigo-50 to-indigo-100 border-indigo-200'
  };

  const headerStyles = {
    user: 'from-blue-100 to-blue-200 text-blue-700',
    developer: 'from-amber-100 to-amber-200 text-amber-700',
    tool: 'from-emerald-100 to-emerald-200 text-emerald-700',
    assistant: 'from-indigo-100 to-indigo-200 text-indigo-700'
  };

  const gradientStyles = {
    user: 'from-blue-50',
    developer: 'from-amber-50',
    tool: 'from-emerald-50',
    assistant: 'from-indigo-50'
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-[0.5px] bg-gradient-to-br shadow-sm transition-all duration-300 hover:shadow-lg ${variantStyles[variant]}`}>
      <div
        className={`flex items-center justify-between border-b-[0.5px] bg-gradient-to-r px-4 py-3 ${headerStyles[variant]} ${isOverflowing ? 'cursor-pointer' : ''}`}
        onClick={() => isOverflowing && setIsExpanded(!isExpanded)}>
        <span className="flex items-center text-sm font-semibold">{title}</span>
        {isOverflowing && (
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
            <DownOutlined
              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              style={{ fontSize: '12px' }}
            />
          </div>
        )}
      </div>
      <div
        ref={contentRef}
        className={`relative p-4 text-gray-700 transition-all duration-300 ${!isExpanded ? 'max-h-[250px]' : ''} ${!isExpanded && isOverflowing ? 'overflow-hidden' : 'overflow-auto'}`}>
        {content}
        {!isExpanded && isOverflowing && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`absolute bottom-0 left-0 right-0 h-16 cursor-pointer bg-gradient-to-t to-transparent ${gradientStyles[variant]}`}
            style={{
              backgroundImage:
                'linear-gradient(to top, var(--tw-gradient-from) 30%, transparent 100%)'
            }}
          />
        )}
      </div>
      {!isExpanded && isOverflowing && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 transform"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}>
          <DownOutlined className="animate-bounce opacity-50" style={{ fontSize: '16px' }} />
        </div>
      )}
    </div>
  );
};

const UserMessage: React.FC<{
  message: LangfuseUserMessage;
}> = ({ message }) => {
  return (
    <MessageCard
      variant="user"
      title="User Message"
      content={<div className="prose prose-sm max-w-none">{message.content}</div>}
    />
  );
};

const AssistantMessage: React.FC<{
  message: LangfuseAssistantMessage;
}> = ({ message }) => {
  const content = useMemo(() => {
    return message.tool_calls.map((tool, index) => {
      let parsedArguments;
      try {
        parsedArguments = JSON.parse(tool.function.arguments);
      } catch (error) {
        parsedArguments = tool.function.arguments;
      }

      return (
        <div key={index} className="mb-4 last:mb-0">
          <div className="flex items-center gap-2 border-l-2 border-indigo-300 pl-3">
            <span className="text-sm font-medium text-gray-500">Function:</span>
            <span className="text-sm font-medium text-indigo-600">{tool.function.name}</span>
          </div>

          <div className="mt-2 border-l-2 border-indigo-100 pl-3">
            <div className="text-sm font-medium text-gray-500">Arguments:</div>
            {typeof parsedArguments === 'object' ? (
              <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-700">
                {JSON.stringify(parsedArguments, null, 2)}
              </pre>
            ) : (
              <div className="mt-1 text-sm text-gray-700">{String(parsedArguments)}</div>
            )}
          </div>
        </div>
      );
    });
  }, [message.tool_calls]);

  return (
    <MessageCard
      variant="assistant"
      title="Assistant Message"
      content={<div className="prose prose-sm max-w-none">{content}</div>}
    />
  );
};

const ToolMessage: React.FC<{
  message: LangfuseToolMessage;
}> = ({ message }) => {
  const parsedContent = useMemo(() => {
    try {
      const content = JSON.parse(message.content);
      return (
        <div className="space-y-3">
          {Object.entries(content).map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border-[0.5px] border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm">
              <div className="mb-2 font-medium text-emerald-700">{key}</div>
              {typeof value === 'object' ? (
                <pre className="font-mono text-sm text-gray-700">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <div className="text-sm text-gray-700">{String(value)}</div>
              )}
            </div>
          ))}
        </div>
      );
    } catch (error) {
      return <div className="text-sm text-gray-700">{message.content}</div>;
    }
  }, [message.content]);

  return <MessageCard variant="tool" title={`Tool: ${message.name}`} content={parsedContent} />;
};

const DeveloperMessage: React.FC<{
  message: LangfuseDeveloperMessage;
}> = ({ message }) => {
  return (
    <MessageCard
      variant="developer"
      title="Developer Message"
      content={
        <div className="prose prose-sm max-w-none whitespace-pre-wrap">{message.content}</div>
      }
    />
  );
};

const ToolCard: React.FC<{
  tool: LangfuseTool;
}> = ({ tool }) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border-[0.5px] border-purple-300 bg-purple-50 shadow-sm transition-all duration-200 hover:border-purple-400 hover:shadow-purple-200">
      <div className="border-b-[0.5px] border-purple-200 bg-purple-100 px-4 py-2">
        <span className="text-sm font-medium text-purple-700">Tool: {tool.function.name}</span>
      </div>
      <div className="whitespace-pre-wrap px-4 py-3">
        <div>
          <span className="font-medium text-purple-700">Arguments:</span>
          <div className="text-purple-600">
            {Object.entries(tool.function.parameters).map(([key, value]) => (
              <div key={key} className="ml-2">
                <span className="font-medium">{key}:</span>{' '}
                {typeof value === 'object' ? (
                  <pre className="ml-4 mt-1 whitespace-pre-wrap">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {tool.function.description && (
          <div className="mt-2">
            <span className="font-medium text-purple-700">Description:</span>{' '}
            <span className="text-purple-600">{tool.function.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};
