import { CONTACT_FORM_COPY } from '@/content/contact-form.content';
import { STATIONS_COPY } from '@/content/stations.content';
import { sendMessageAction } from '@/sections/contact/actions/send-message.action';
import { ContactForm } from '@/sections/contact/contact-form.client';
import { CopyEmail } from '@/sections/contact/copy-email.client';
import { TrackedLink } from '@/shared/tracked-link.client';

export const Contact = () => {
  const copy = STATIONS_COPY.contact;

  return (
    <>
      <p className="tag" data-motion="tag">
        {copy.tag}
      </p>

      <h2 id="contact-title" data-motion="title">
        {copy.title}
      </h2>

      <p className="lede" data-motion="lede">
        {copy.lede}
      </p>

      <ul className="direct">
        <li data-motion="item">
          <CopyEmail email={copy.email} copy={copy.copy} />
        </li>

        <li data-motion="item">
          <TrackedLink href={copy.linkedin.href} external event={{ name: 'linkedin_click' }}>
            {copy.linkedin.label}
          </TrackedLink>
        </li>
      </ul>

      <ContactForm action={sendMessageAction} copy={CONTACT_FORM_COPY} />
    </>
  );
};
