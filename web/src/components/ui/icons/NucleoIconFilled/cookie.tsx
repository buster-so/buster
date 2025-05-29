import type { iconProps } from './iconProps';

function cookie(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cookie';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="12.25" cy="1.75" fill="currentColor" r=".75" />
        <circle cx="14.75" cy="4.25" fill="currentColor" r=".75" />
        <path
          d="M16.87,7.599c-.039-.222-.176-.415-.373-.524-.197-.109-.433-.125-.642-.042-.363,.144-.735,.217-1.105,.217-1.498,0-2.77-1.128-2.958-2.624-.051-.403-.409-.688-.818-.652l-.224,.026c-1.209,0-2.193-.951-2.239-2.165-.008-.216-.109-.418-.277-.554-.168-.137-.386-.193-.6-.157C3.79,1.788,1,5.1,1,9c0,4.411,3.589,8,8,8s8-3.589,8-8c0-.451-.042-.909-.13-1.401Zm-9.87-1.599c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm.25,6.5c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25,1.25,.56,1.25,1.25-.56,1.25-1.25,1.25Zm4,0c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cookie;
