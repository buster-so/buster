import type { iconProps } from './iconProps';

function textBgColor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text bg color';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M7.96 10L10.04 10 9 7.525 7.96 10z" fill="currentColor" />
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-1.161,10.941c-.095,.04-.193,.059-.29,.059-.293,0-.571-.172-.692-.459l-.437-1.041h-3.34l-.437,1.041c-.161,.382-.6,.562-.982,.401-.382-.16-.562-.6-.401-.982l2.73-6.5c.117-.278,.39-.459,.691-.459h.136c.302,0,.575,.181,.691,.459l2.73,6.5c.161,.382-.019,.822-.401,.982Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textBgColor;
