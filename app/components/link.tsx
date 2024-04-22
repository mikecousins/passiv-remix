import { DataInteractive as HeadlessDataInteractive } from '@headlessui/react';
import React from 'react';
import { Link as RemixLink } from '@remix-run/react';

export const Link = React.forwardRef(function Link(
  props: { href: string } & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <HeadlessDataInteractive>
      <RemixLink {...props} ref={ref} to={props.href} />
    </HeadlessDataInteractive>
  );
});
