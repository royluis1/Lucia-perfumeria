export function ProductBottlePlaceholder({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex items-center justify-center bg-sand ${className}`}>
      <svg className="h-[68%] max-h-72 w-auto max-w-[70%]" fill="none" viewBox="0 0 160 240">
        <path d="M62 18h36v32H62z" fill="#26231f" />
        <path d="M55 46h50v15H55z" fill="#807767" />
        <path
          d="M48 61h64c4 0 7 3 8 7l12 29v111c0 10-8 18-18 18H46c-10 0-18-8-18-18V97l12-29c1-4 4-7 8-7Z"
          fill="#ded8cc"
          stroke="#827a6c"
          strokeWidth="2"
        />
        <path d="M38 104h84v76H38z" fill="#eee9df" stroke="#a49b8b" strokeWidth="1.5" />
        <path d="M55 126h50" stroke="#81786a" strokeWidth="2" />
        <path d="M65 138h30" stroke="#81786a" strokeWidth="1.5" />
        <path d="M50 72h60" stroke="white" strokeOpacity=".7" strokeWidth="3" />
      </svg>
    </span>
  );
}
