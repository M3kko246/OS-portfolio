import '../apps.css';
import { useOsIndex } from '@/os/context';
import { formatPeriod } from '@/lib/format';
import { useT } from '@/os/lib/i18n';
import { EmptyState } from '@/os/ui/States';
import { Tabs } from '@/os/ui/Tabs';
import { BrandMark } from '@/os/ui/primitives';

export default function About() {
  const t = useT();
  const { profile, experience, lang } = useOsIndex();
  const groups = [
    { title: t('path.work'), items: experience.filter((e) => e.kind === 'work') },
    { title: t('path.education'), items: experience.filter((e) => e.kind === 'education') },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="app-about">
      <Tabs
        label={t('about.tabs')}
        tabs={[
          {
            id: 'general',
            label: t('about.general'),
            render: () => (
              <div className="about-general">
                <div className="about-id">
                  {/* Placeholder avatar until the owner's photo arrives (CONTENT_TODO.md). */}
                  <BrandMark className="brand-mark-4" />
                  <div>
                    <h3 className="text-read-lg font-bold">{profile.name}</h3>
                    <p>{profile.role}</p>
                  </div>
                </div>
                <p className="about-bio">{profile.bioLong}</p>
                <p className="about-availability">
                  <span
                    className="availability-dot"
                    data-available={String(profile.availability.available)}
                  />
                  <span className="sr-only">{t('availability.title')}:</span>
                  {profile.availability.label}
                </p>
                <h4 className="font-bold">{t('section.languages')}</h4>
                <ul className="about-list">
                  {profile.languages.map((l) => (
                    <li key={l.name}>
                      {l.name}: {l.level}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          },
          {
            id: 'skills',
            label: t('about.skills'),
            render: () => (
              <div className="about-skills">
                {profile.skills.map((group) => (
                  <details key={group.area} open className="skill-group">
                    <summary>{group.area}</summary>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            ),
          },
          {
            id: 'path',
            label: t('about.path'),
            render: () =>
              groups.length === 0 ? (
                <EmptyState message={t('about.emptyPath')} />
              ) : (
                <div className="about-path">
                  {groups.map((group) => (
                    <section key={group.title}>
                      <h3 className="font-bold">{group.title}</h3>
                      <ol>
                        {group.items.map((entry) => (
                          <li key={entry.id}>
                            <h4 className="font-bold">{entry.title}</h4>
                            <p className="about-meta">
                              {entry.org} · {formatPeriod(entry.start, entry.end, lang)}
                            </p>
                            <p>{entry.description}</p>
                          </li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              ),
          },
        ]}
      />
    </div>
  );
}
