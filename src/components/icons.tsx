
import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  google: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="48px"
      height="48px"
      {...props}
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.108-11.28-7.581l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.853,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  ),
  facebook: (props: SVGProps<SVGSVGElement>) => (
     <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  playlist: (props: SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <path d="M21 15V6"/>
        <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        <path d="M12 12H3"/>
        <path d="M16 6H3"/>
        <path d="M12 18H3"/>
    </svg>
  ),
  spinner: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  verified: (props: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 22 22"
      aria-label="Verified account"
      role="img"
      fill="currentColor"
      {...props}
    >
      <path d="M21.383 10.976a1.44 1.44 0 0 1-1.252 2.057 1.417 1.417 0 0 0-.883 1.054 1.42 1.42 0 0 1-1.954 1.43 1.418 1.418 0 0 0-.97 1.218 1.42 1.42 0 0 1-2.152.923 1.417 1.417 0 0 0-1.217.97 1.42 1.42 0 0 1-2.43 0 1.417 1.417 0 0 0-1.218-.97A1.42 1.42 0 0 1 7.15 16.52a1.417 1.417 0 0 0-.97-1.218 1.42 1.42 0 0 1-.924-2.152 1.417 1.417 0 0 0-.882-1.054 1.42 1.42 0 0 1 0-2.43 1.417 1.417 0 0 0 .883-1.054 1.42 1.42 0 0 1 .923-2.152 1.417 1.417
 0 0 0 .97-1.218 1.42 1.42 0 0 1 2.152-.923 1.417 1.417 0 0 0 1.218-.97 1.42 1.42 0 0 1 2.43 0 1.417 1.417 0 0 0 1.217.97 1.42 1.42 0 0 1 .924 2.152 1.417 1.417 0 0 0 .97 1.218 1.42 1.42 0 0 1 1.954 1.43 1.417 1.417 0 0 0 .882 1.054 1.44 1.44 0 0 1 1.252 2.057zm-5.74-3.53a.998.998 0 0 0-1.413 0L9.34 12.333a.997.997 0 0 1-1.413 0l-1.9-1.9a.998.998 0 1 0-1.413 1.413l2.6 2.6a.997.997 0 0 0 1.413 0L15.643 8.86a.998.998 0 0 0 0-1.413z" fillRule="evenodd"></path>
    </svg>
  )
};
