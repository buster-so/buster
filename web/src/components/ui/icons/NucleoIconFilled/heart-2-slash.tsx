import type { iconProps } from './iconProps';

function heart2Slash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.2,12.8L15.106,2.894c-1.048-.745-2.326-1.028-3.576-.777-1.003,.203-1.883,.718-2.534,1.464-.039-.044-.079-.088-.12-.132-.84-.884-1.974-1.389-3.193-1.42-1.211-.026-2.378,.414-3.262,1.253-1.825,1.734-1.9,4.63-.163,6.459l2.943,3.058Z"
          fill="currentColor"
        />
        <path
          d="M16.559,4.623L6.76,14.421l.977,1.015c.332,.346,.78,.537,1.26,.537h0c.48,0,.928-.19,1.261-.537l5.48-5.694s.003-.002,.004-.003c1.102-1.161,1.512-2.795,1.098-4.374-.067-.256-.167-.502-.281-.743Z"
          fill="currentColor"
        />
        <path
          d="M2.75,16c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L3.28,15.78c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default heart2Slash;
