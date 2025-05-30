import type { iconProps } from './iconProps';

function faceNerdSmile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face nerd smile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.607,7c.335-1.29,1.5-2.25,2.893-2.25,1.235,0,2.297,.751,2.756,1.819,.233-.102,.48-.172,.744-.172s.512,.07,.744,.171c.46-1.068,1.521-1.818,2.756-1.818,1.394,0,2.558,.96,2.893,2.25h1.343c-.892-3.445-4.017-6-7.737-6S2.155,3.555,1.263,7h1.343Z"
          fill="currentColor"
        />
        <path
          d="M16.975,8.5h-1.581c-.335,1.29-1.5,2.25-2.893,2.25-1.175,0-2.185-.686-2.676-1.672-.01-.017-.497-.998-.497-.998-.111-.21-.53-.23-.663,.021,0,0-.47,.948-.477,.959-.488,.997-1.504,1.691-2.687,1.691-1.394,0-2.558-.96-2.893-2.25H1.025c-.01,.166-.025,.331-.025,.5,0,4.411,3.589,8,8,8s8-3.589,8-8c0-.169-.015-.334-.025-.5Zm-5.091,4.16c-.631,.996-1.709,1.59-2.884,1.59s-2.253-.595-2.884-1.59c-.222-.35-.117-.813,.232-1.035,.349-.221,.812-.119,1.035,.232,.354,.559,.958,.893,1.616,.893s1.262-.334,1.616-.893c.222-.35,.684-.453,1.035-.232,.35,.222,.454,.685,.232,1.035Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceNerdSmile;
