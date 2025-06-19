import type { iconProps } from './iconProps';

function circleDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle dotted';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="3.873" cy="14.127" fill="currentColor" r=".75" />
        <circle cx="1.75" cy="9" fill="currentColor" r=".75" />
        <circle cx="3.873" cy="3.873" fill="currentColor" r=".75" />
        <circle cx="6.226" cy="15.698" fill="currentColor" r=".75" />
        <circle cx="2.302" cy="11.774" fill="currentColor" r=".75" />
        <circle cx="2.302" cy="6.226" fill="currentColor" r=".75" />
        <circle cx="6.226" cy="2.302" fill="currentColor" r=".75" />
        <circle cx="9" cy="1.75" fill="currentColor" r=".75" />
        <circle cx="9" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="14.127" cy="14.127" fill="currentColor" r=".75" />
        <circle cx="16.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="14.127" cy="3.873" fill="currentColor" r=".75" />
        <circle cx="11.774" cy="15.698" fill="currentColor" r=".75" />
        <circle cx="15.698" cy="11.774" fill="currentColor" r=".75" />
        <circle cx="15.698" cy="6.226" fill="currentColor" r=".75" />
        <circle cx="11.774" cy="2.302" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default circleDotted;
