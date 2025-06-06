import type { iconProps } from './iconProps';

function button(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px button';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.407,10.456c-.349-.947-.121-1.983,.597-2.701,.484-.486,1.13-.755,1.816-.755,.3,0,.597,.052,.882,.155l6.278,2.294c.005-.067,.02-.131,.02-.199v-3.5c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v3.5c0,1.517,1.233,2.75,2.75,2.75H7.971l-.564-1.544Z"
          fill="currentColor"
        />
        <path
          d="M17.046,11.07l-6.854-2.504c-.397-.144-.83-.049-1.128,.25-.299,.299-.394,.73-.248,1.125l2.504,6.854c.154,.424,.558,.705,1.007,.705,.008,0,.015,0,.022,0,.458-.009,.859-.309,.999-.746l.887-2.769,2.769-.886c.437-.14,.736-.542,.746-1,.009-.458-.274-.872-.704-1.029Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default button;
