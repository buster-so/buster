import type { iconProps } from './iconProps';

function starHalf2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star half 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.17,1.02c-.342-.078-.688,.086-.843,.398l-2.066,4.186-4.62,.671c-.282,.041-.517,.239-.605,.51-.088,.271-.015,.57,.19,.769l3.343,3.258-.789,4.601c-.048,.282,.067,.566,.298,.734,.131,.095,.286,.143,.441,.143,.12,0,.239-.028,.349-.086l4.48-2.356c.247-.129,.401-.385,.401-.664V1.75c0-.349-.24-.651-.58-.73Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default starHalf2;
