import type { iconProps } from './iconProps';

function airbag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px airbag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="12" cy="6" fill="currentColor" r="4" />
        <circle cx="3.25" cy="5.25" fill="currentColor" r="2.25" />
        <path
          d="M11.194,12.683c-.304-.575-.896-.933-1.547-.933h-1.927c-.471,0-.896-.26-1.111-.679l-1.25-2.433c-.189-.368-.642-.515-1.01-.324-.368,.189-.514,.641-.324,1.01l1.25,2.433c.472,.921,1.409,1.494,2.445,1.494h1.927c.093,0,.178,.051,.221,.133l1.569,2.967c.135,.254,.395,.399,.664,.399,.118,0,.238-.028,.35-.087,.366-.194,.506-.647,.312-1.014l-1.569-2.967Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default airbag;
