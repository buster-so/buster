import type { iconProps } from './iconProps';

function octagonCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px octagon check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.694,5.088l-2.782-2.782c-.52-.52-1.21-.806-1.945-.806h-3.935c-.735,0-1.425,.286-1.945,.806l-2.782,2.782c-.52,.52-.806,1.21-.806,1.945v3.935c0,.735,.286,1.425,.806,1.945l2.782,2.782c.52,.52,1.21,.806,1.945,.806h3.935c.735,0,1.425-.286,1.945-.806l2.782-2.782c.52-.52,.806-1.21,.806-1.945v-3.935c0-.735-.286-1.425-.806-1.945Zm-2.851,1.621l-4.25,5.5c-.136,.176-.343,.283-.565,.291-.01,0-.019,0-.028,0-.212,0-.415-.09-.558-.248l-2.25-2.5c-.277-.308-.252-.782,.056-1.06,.309-.276,.781-.252,1.06,.056l1.648,1.832,3.701-4.789c.253-.328,.725-.387,1.052-.135,.328,.253,.388,.724,.135,1.052Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default octagonCheck;
