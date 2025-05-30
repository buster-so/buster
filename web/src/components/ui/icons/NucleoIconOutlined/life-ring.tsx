import type { iconProps } from './iconProps';

function lifeRing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px life ring';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.486,7.688c.379-1.016,1.187-1.823,2.203-2.203"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.312,5.486c1.016,.379,1.823,1.187,2.203,2.203"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.514,10.312c-.379,1.016-1.187,1.823-2.203,2.203"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.688,12.514c-1.016-.379-1.823-1.187-2.203-2.203"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.464,15.794c-1.964-.733-3.525-2.294-4.259-4.259"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.794,11.536c-.733,1.964-2.295,3.525-4.259,4.259"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.536,2.206c1.964,.733,3.525,2.295,4.259,4.259"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.206,6.464c.733-1.964,2.294-3.525,4.259-4.259"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.311,5.487l1.399-3.749h0c-.844-.315-1.757-.487-2.711-.487-.954,0-1.867,.172-2.711,.487l1.399,3.749c.409-.153,.849-.236,1.311-.236s.903,.084,1.311,.237Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.513,10.311l3.749,1.399h0c.315-.844,.487-1.757,.487-2.71,0-.954-.172-1.867-.487-2.711l-3.749,1.399c.153,.409,.236,.849,.236,1.311s-.084,.903-.237,1.311Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.689,12.513l-1.399,3.749h0c.844,.315,1.757,.487,2.711,.487,.954,0,1.867-.172,2.711-.487l-1.399-3.749c-.409,.153-.849,.236-1.311,.236s-.903-.084-1.311-.237Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.487,7.689l-3.749-1.399h0c-.315,.844-.487,1.757-.487,2.71,0,.954,.172,1.867,.487,2.711l3.749-1.399c-.153-.409-.236-.849-.236-1.311s.084-.903,.237-1.311Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default lifeRing;
