import type { iconProps } from './iconProps';

function bookOpen2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px book open 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.304.679c-.442-.333-1.002-.438-1.535-.286l-3.769,1.077L2.231.393c-.534-.153-1.092-.048-1.535.286-.442.333-.696.843-.696,1.397v6.92c0,.777.522,1.469,1.269,1.683l4.525,1.293c.067.019.137.029.206.029s.139-.01.206-.029l4.525-1.293c.747-.213,1.269-.905,1.269-1.683V2.076c0-.554-.254-1.063-.696-1.397Zm-.804,8.317c0,.111-.074.21-.181.24l-4.319,1.234V3.024l4.181-1.188c.105-.029.182.013.22.041.037.028.099.091.099.2v6.92Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default bookOpen2;
