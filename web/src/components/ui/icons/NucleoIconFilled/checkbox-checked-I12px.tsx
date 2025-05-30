import type { iconProps } from './iconProps';

function checkboxChecked(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px checkbox checked';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.407,4.708l-4.25,5.5c-.136,.176-.343,.283-.565,.291-.01,0-.019,0-.028,0-.212,0-.415-.09-.558-.248l-2.25-2.5c-.277-.308-.252-.782,.056-1.06,.309-.276,.782-.252,1.06,.056l1.648,1.832,3.701-4.789c.252-.328,.726-.388,1.052-.135,.328,.253,.388,.724,.135,1.052Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default checkboxChecked;
