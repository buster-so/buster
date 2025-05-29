import type { iconProps } from './iconProps';

function userSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.5,13c0-1.599,.844-2.997,2.104-3.795-.521-.124-1.055-.205-1.604-.205-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.597,0,1.191-.044,1.783-.108-1.356-.776-2.283-2.22-2.283-3.892Z"
          fill="currentColor"
        />
        <path
          d="M16.78,15.72l-1.205-1.205c.263-.446,.425-.96,.425-1.514,0-1.654-1.346-3-3-3s-3,1.346-3,3,1.346,3,3,3c.555,0,1.068-.162,1.514-.425l1.205,1.205c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Zm-5.28-2.72c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5c0,.413-.168,.787-.438,1.058,0,0-.002,0-.002,.002s0,.002-.002,.002c-.271,.271-.645,.438-1.058,.438-.827,0-1.5-.673-1.5-1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userSearch;
