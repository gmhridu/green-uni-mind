export type TDashboardNavMenuItem = {
  title: string;
  url?: string;
  items?: TDashboardNavMenuItem[];
};

export type TDashboardNavMenu = {
  versions?: string[];
  navMain: TDashboardNavMenuItem[];
};

export const teacherMenu: TDashboardNavMenu = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Getting Started",
      items: [
        {
          title: "Overview",
          url: "/teacher/dashboard/overview",
        },
        {
          title: "Courses",
          url: "/teacher/dashboard/courses",
          items: [
            {
              title: "create-course",
              url: "/teacher/dashboard/create-course",
            },
          ],
        },
      ],
    },
  ],
};

export const studentMenu = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
  ],
};
