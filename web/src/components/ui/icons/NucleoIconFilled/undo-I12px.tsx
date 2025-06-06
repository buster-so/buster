import type { iconProps } from './iconProps';

function undo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px undo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15,10.75c-.175,0-.351-.061-.493-.185-.711-.621-2.672-2.066-5.507-2.066-2.814,0-4.771,1.429-5.481,2.043-.314,.271-.788,.236-1.058-.077-.271-.313-.236-.787,.077-1.058,.838-.724,3.144-2.409,6.462-2.409,3.342,0,5.654,1.704,6.493,2.436,.312,.272,.344,.746,.072,1.058-.148,.17-.356,.257-.565,.257Z"
          fill="currentColor"
        />
        <path
          d="M7.531,11.972c-.064,0-.13-.008-.196-.026l-4.53-1.222c-.203-.055-.375-.193-.471-.38s-.11-.406-.037-.604l1.625-4.402c.144-.388,.575-.586,.963-.444,.389,.144,.587,.575,.444,.963l-1.341,3.632,3.738,1.008c.4,.108,.637,.52,.529,.919-.09,.334-.393,.555-.724,.555Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default undo;
