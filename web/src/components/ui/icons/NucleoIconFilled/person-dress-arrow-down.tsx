import type { iconProps } from './iconProps';

function personDressArrowDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person dress arrow down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6.001" cy="2.5" fill="currentColor" r="2.5" />
        <path
          d="M9.14,7.404c-.183-.664-.74-1.162-1.418-1.267-1.129-.178-2.298-.178-3.43-.002-.686,.107-1.247,.604-1.43,1.269l-1.659,6.014c-.105,.379-.028,.777,.21,1.09s.601,.493,.994,.493h.903l.117,1.395c.074,.9,.84,1.605,1.743,1.605h1.66c.903,0,1.669-.705,1.743-1.604l.117-1.396h.902c.394,0,.757-.18,.995-.493s.315-.71,.21-1.09l-1.659-6.013Z"
          fill="currentColor"
        />
        <path
          d="M15.97,10.22l-.97,.97V5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.189l-.97-.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.25,2.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default personDressArrowDown;
