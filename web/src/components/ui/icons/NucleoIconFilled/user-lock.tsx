import type { iconProps } from './iconProps';

function userLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.5,15.25v-1.5c0-1.129,.597-2.149,1.507-2.732,.041-.667,.268-1.28,.614-1.809-.526-.126-1.066-.209-1.621-.209-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.007,0,.013,0,.02,0-.325-.506-.52-1.104-.52-1.749Z"
          fill="currentColor"
        />
        <path
          d="M16,12.025v-.775c0-1.241-1.009-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v.775c-.846,.123-1.5,.845-1.5,1.725v1.5c0,.965,.785,1.75,1.75,1.75h4c.965,0,1.75-.785,1.75-1.75v-1.5c0-.879-.654-1.602-1.5-1.725Zm-2.25-1.525c.414,0,.75,.336,.75,.75v.75h-1.5v-.75c0-.414,.336-.75,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userLock;
