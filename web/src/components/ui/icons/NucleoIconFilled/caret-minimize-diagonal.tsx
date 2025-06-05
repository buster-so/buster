import type { iconProps } from './iconProps';

function caretMinimizeDiagonal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret minimize diagonal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.707.396c-.287-.287-.714-.373-1.09-.217-.375.155-.617.518-.617.924v3.896c0,.551.449,1,1,1h3.896c.406,0,.769-.242.924-.617s.07-.803-.217-1.09L7.707.396Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5,6H1.104c-.406,0-.769.242-.924.617s-.07.803.217,1.09l3.896,3.896c.192.192.446.293.706.293.129,0,.259-.025.384-.077.375-.155.617-.518.617-.924v-3.896c0-.551-.449-1-1-1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default caretMinimizeDiagonal;
