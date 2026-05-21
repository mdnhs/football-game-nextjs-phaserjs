'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { ChevronRightIcon } from 'lucide-react';

interface SubItem {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  items?: SubItem[];
}

export function NavMain({ label, items }: { label?: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className='text-muted-foreground/70 text-[10px] font-semibold tracking-[0.12em] uppercase'>
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = (item.items?.length ?? 0) > 0;
          if (!hasChildren) {
            const active = pathname === item.url || item.isActive;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={active}
                  render={<Link href={item.url} />}
                  className='group/menu data-[active=true]:bg-primary/10 data-[active=true]:text-foreground hover:bg-muted/60 transition data-[active=true]:font-semibold data-[active=true]:shadow-[inset_2px_0_0_0_var(--color-primary)]'
                >
                  <span className='shrink-0 [&_svg]:size-4'>{item.icon}</span>
                  <span className='truncate'>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className='group/collapsible'
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.isActive}
                    className='data-[active=true]:bg-primary/10 data-[active=true]:text-foreground hover:bg-muted/60 transition data-[active=true]:font-semibold data-[active=true]:shadow-[inset_2px_0_0_0_var(--color-primary)]'
                  />
                }
              >
                <span className='shrink-0 [&_svg]:size-4'>{item.icon}</span>
                <span className='truncate'>{item.title}</span>
                <ChevronRightIcon className='text-muted-foreground ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-open/collapsible:rotate-90' />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className='border-l-border/60'>
                  {item.items?.map((subItem) => {
                    const subActive = pathname === subItem.url;
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          isActive={subActive}
                          render={<Link href={subItem.url} />}
                          className='data-[active=true]:text-foreground data-[active=true]:bg-primary/10 hover:bg-muted/50 transition data-[active=true]:font-medium'
                        >
                          <span className='truncate'>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
