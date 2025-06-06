import type { iconProps } from './iconProps';

function userBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M10.5,11.75c0-.892,.362-1.7,.946-2.288-.771-.29-1.593-.462-2.446-.462-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.502,0,1.002-.03,1.5-.075v-5.175Z"
          fill="currentColor"
        />
        <path
          d="M16.25,10h-2.5c-.965,0-1.75,.785-1.75,1.75v5.5c0,.303,.183,.577,.463,.693s.603,.052,.817-.163l1.72-1.72,1.72,1.72c.144,.144,.335,.22,.53,.22,.097,0,.194-.019,.287-.057,.28-.116,.463-.39,.463-.693v-5.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userBookmark;
