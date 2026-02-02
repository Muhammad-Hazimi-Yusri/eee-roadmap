// src/utils/roadmapInteractions.ts

/**
 * Initializes all roadmap interactivity:
 * - Expand/collapse topics
 * - Progress tracking
 * - Tools mode
 * - Settings panel
 * - Concept pills
 */

import { createProgressStore } from '../utils/progress';

import {
  initTrailCanvas,
  drawTrailLine,
  clearTrail,
  fadeOutTrail,
  type TrailState,
} from '../utils/trail';

import {
  applyToolAction,
  canApplyToPrereq,
  type ToolName,
  type ModeName,
} from '../utils/tools';

import { queueSync } from '../lib/sync';

export function initRoadmapInteractions(): void {
  // Debug: mark that JS initialized
  document.body.setAttribute('data-js-ready', 'true');
  
  const progressStore = createProgressStore('eee-progress-v2', 'local');
  const { 
    isComplete, 
    isImportant, 
    toggleComplete, 
    toggleImportant, 
    setComplete, 
    setImportant, 
    resetState 
  } = progressStore;

  // ============================================
  // NODE EXPANSION
  // ============================================
  function expandNode(id: string) {
    const node = document.getElementById(id);
    if (!node) return;
    
    const btn = node.querySelector('.node-button');
    const content = node.querySelector('.node-content') as HTMLElement;
    
    if (btn && content) {
      btn.setAttribute('aria-expanded', 'true');
      content.hidden = false;
    }
  }

  function initNodeToggles() {
    const EXPANDED_KEY = `roadmap-expanded-${(window as any).trackSlug}`;
    
    // Load saved expanded topics
    function getExpandedTopics(): string[] {
      try {
        const saved = localStorage.getItem(EXPANDED_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    
    function saveExpandedTopics(topics: string[]) {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(topics));
    }
    
    // Apply saved state on load
    const expandedTopics = getExpandedTopics();
    expandedTopics.forEach(topicId => {
      const node = document.querySelector(`[data-node-id="${topicId}"]`);
      if (node) {
        const btn = node.querySelector('.node-button');
        const content = node.querySelector('.node-content') as HTMLElement;
        if (btn && content) {
          btn.setAttribute('aria-expanded', 'true');
          content.hidden = false;
        }
      }
    });
    
    // Click handlers
    document.querySelectorAll('.node-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const content = btn.nextElementSibling as HTMLElement;
        const node = btn.closest('[data-node-id]');
        const topicId = node?.getAttribute('data-node-id');
        
        btn.setAttribute('aria-expanded', String(!expanded));
        content.hidden = expanded;
        
        // Save state
        if (topicId) {
          let topics = getExpandedTopics();
          if (!expanded) {
            // Now expanding - add to list
            if (!topics.includes(topicId)) {
              topics.push(topicId);
            }
          } else {
            // Now collapsing - remove from list
            topics = topics.filter(id => id !== topicId);
          }
          saveExpandedTopics(topics);
        }
      });
    });
  }

  function initHashNavigation() {
    // Auto-expand on page load if hash exists
    if (window.location.hash) {
      const topicId = window.location.hash.slice(1);
      expandNode(topicId);
      
      // Check for concept query param
      const params = new URLSearchParams(window.location.search);
      const conceptName = params.get('concept');
      if (conceptName) {
        // Delay to ensure node is expanded and modal is ready
        setTimeout(() => {
          (window as any).conceptModal?.open(topicId, conceptName);
        }, 300);
      }
    }

    // Handle hash changes (same-page navigation)
    window.addEventListener('hashchange', () => {
      if (window.location.hash) {
        const topicId = window.location.hash.slice(1);
        expandNode(topicId);
        
        const params = new URLSearchParams(window.location.search);
        const conceptName = params.get('concept');
        if (conceptName) {
          setTimeout(() => {
            (window as any).conceptModal?.open(topicId, conceptName);
          }, 300);
        }
      }
    });
  }

  // ============================================
  // PROGRESS TRACKING
  // ============================================
  function isTopicCompleted(topicId: string): boolean {
    const node = document.querySelector(`[data-node-id="${topicId}"]`);
    if (!node) return false;
    
    const pills = node.querySelectorAll('.concept-pill');
    if (pills.length === 0) return false;
    
    return Array.from(pills).every(pill => {
      const concept = pill.getAttribute('data-concept');
      return isComplete(`${topicId}:${concept}`);
    });
  }

  function updateTopicStatus(topicId: string) {
    const node = document.querySelector(`[data-node-id="${topicId}"]`);
    if (!node) return;
    
    node.classList.toggle('topic--completed', isTopicCompleted(topicId));
  }

  function updatePrereqCompletionStatus() {
    document.querySelectorAll('.prereq-tag--link[data-prereq-topic]').forEach((link) => {
      const topicId = link.getAttribute('data-prereq-topic');
      if (!topicId) return;
      
      link.classList.toggle('prereq--completed', isTopicCompleted(topicId));
    });
  }

  function initStaticPrereqs() {
    document.querySelectorAll('.prereq-tag--static[data-static-prereq]').forEach((tag) => {
      const prereq = tag.getAttribute('data-static-prereq');
      if (!prereq) return;
      
      const key = `static:${prereq}`;
      
      // Set initial state
      if (isComplete(key)) {
        tag.classList.add('prereq-tag--completed');
      }
      
      // Click handler
      tag.addEventListener('click', () => {
        const completed = toggleComplete(key);
        tag.classList.toggle('prereq-tag--completed', completed);
        queueSync();
      });
    });
  }

  function initProgressTracking() {
    document.querySelectorAll('.concept-pill').forEach((pill) => {
      const topicId = pill.getAttribute('data-topic-id');
      const concept = pill.getAttribute('data-concept');
      if (!topicId || !concept) return;
      
      const key = `${topicId}:${concept}`;
      
      // Set initial state
      if (isComplete(key)) {
        pill.classList.add('concept-pill--completed');
      }
      if (isImportant(key)) {
        pill.classList.add('concept-pill--important');
      }
      updateTopicStatus(topicId);
      
      let clickTimer: number | null = null;

      // Simple mode: click = notes, dblclick = complete, shift+click = important
      pill.addEventListener('click', (e) => {
        if (currentMode !== 'simple') return;
        const event = e as MouseEvent;

        if (event.shiftKey) {
          // Shift+Click → toggle important
          const important = toggleImportant(key);
          pill.classList.toggle('concept-pill--important', important);
          queueSync();
          return; // Don't also open notes on shift+click
        } 

        // Delay to allow double-click detection
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
          return; // Don't also open notes on double-click
        }

        clickTimer = window.setTimeout(() => {
          clickTimer = null;
          const topicId = pill.getAttribute('data-topic-id');
          const conceptName = pill.getAttribute('data-concept');
          if (topicId && conceptName) {
            (window as any).conceptModal?.open(topicId, conceptName);
          }
        }, 250);
      });

      pill.addEventListener('dblclick', () => {
        if (currentMode !== 'simple') return;
          if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
          }
        // Double-click → toggle complete
        const completed = toggleComplete(key);
        pill.classList.toggle('concept-pill--completed', completed);
        updateTopicStatus(topicId);
        updatePrereqCompletionStatus();
        queueSync();
      });
    });
    
    updatePrereqCompletionStatus();
  }

  // ============================================
  // PREREQ LINK BEHAVIOR
  // ============================================
  function applyPrereqBehavior(behavior: string) {
    const currentPath = window.location.pathname;
    const currentTrack = currentPath.match(/\/roadmaps\/(\w+)/)?.[1] || '';

    document.querySelectorAll('.prereq-tag--link').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const linkTrack = href.match(/\/roadmaps\/(\w+)/)?.[1] || '';
      
      let openInNewTab = false;
      
      if (behavior === 'new-tab') {
        openInNewTab = true;
      } else if (behavior === 'smart') {
        openInNewTab = linkTrack !== currentTrack;
      }

      if (openInNewTab) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      } else {
        link.removeAttribute('target');
        link.removeAttribute('rel');
      }
    });
  }

  function initPrereqBehavior() {
    const prereqSelect = document.getElementById('prereq-link-behavior') as HTMLSelectElement;
    if (!prereqSelect) return;

    const savedBehavior = localStorage.getItem('prereq-link-behavior') || 'smart';
    prereqSelect.value = savedBehavior;
    applyPrereqBehavior(savedBehavior);

    prereqSelect.addEventListener('change', () => {
      const value = prereqSelect.value;
      localStorage.setItem('prereq-link-behavior', value);
      applyPrereqBehavior(value);
    });
  }

  // ============================================
  // SETTINGS PANEL
  // ============================================
  function initSettingsPanel() {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const keepClosedCheckbox = document.getElementById('keep-panel-closed') as HTMLInputElement;
    
    if (!settingsToggle || !settingsPanel) return;

    const PANEL_STATE_KEY = 'roadmap-panel-state';
    const PANEL_CLOSED_AT_KEY = 'roadmap-panel-closed-at';
    const PANEL_KEEP_CLOSED_KEY = 'roadmap-panel-keep-closed';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Load saved state
    const savedState = localStorage.getItem(PANEL_STATE_KEY);
    const closedAt = localStorage.getItem(PANEL_CLOSED_AT_KEY);
    const keepClosed = localStorage.getItem(PANEL_KEEP_CLOSED_KEY) === 'true';

    // Determine if panel should be open
    const isMobile = window.innerWidth < 768;
    let shouldBeOpen = !isMobile; // Desktop: open, Mobile: closed
    let shouldGlow = true; // Glow to draw attention
    
    if (keepClosed) {
      shouldBeOpen = false;
      shouldGlow = false; // User explicitly chose to keep closed
    } else if (savedState) {
      // User has interacted before - respect their choice
      if (savedState === 'closed' && closedAt) {
        const elapsed = Date.now() - parseInt(closedAt, 10);
        shouldBeOpen = elapsed > ONE_DAY_MS;
      } else if (savedState === 'open') {
        shouldBeOpen = true;
      }
      shouldGlow = false; // Don't glow if they've seen it before
    }

    // Apply initial state
    settingsToggle.setAttribute('aria-expanded', String(shouldBeOpen));
    settingsPanel.hidden = !shouldBeOpen;
    if (shouldGlow) {
      settingsToggle.classList.add('settings-toggle--glow');
    }

    // Toggle handler
    settingsToggle.addEventListener('click', () => {
      const isExpanded = settingsToggle.getAttribute('aria-expanded') === 'true';
      const newState = !isExpanded;
      
      settingsToggle.setAttribute('aria-expanded', String(newState));
      settingsPanel.hidden = !newState;
      
      localStorage.setItem(PANEL_STATE_KEY, newState ? 'open' : 'closed');
      if (!newState) {
        localStorage.setItem(PANEL_CLOSED_AT_KEY, String(Date.now()));
      }
    });

    // Keep closed checkbox handler
    keepClosedCheckbox?.addEventListener('change', () => {
      localStorage.setItem(PANEL_KEEP_CLOSED_KEY, String(keepClosedCheckbox.checked));
    });
  }

  function initExpandCollapseAll() {
    const expandAllBtn = document.getElementById('expand-all');
    const collapseAllBtn = document.getElementById('collapse-all');
    const EXPANDED_KEY = `roadmap-expanded-${(window as any).trackSlug}`;
    
    expandAllBtn?.addEventListener('click', () => {
      const allTopicIds: string[] = [];
      document.querySelectorAll('.roadmap-node').forEach(node => {
        const button = node.querySelector('.node-button');
        const content = node.querySelector('.node-content');
        const topicId = node.getAttribute('data-node-id');
        if (button && content) {
          button.setAttribute('aria-expanded', 'true');
          (content as HTMLElement).hidden = false;
          if (topicId) allTopicIds.push(topicId);
        }
      });
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(allTopicIds));
    });
    
    collapseAllBtn?.addEventListener('click', () => {
      document.querySelectorAll('.roadmap-node').forEach(node => {
        const button = node.querySelector('.node-button');
        const content = node.querySelector('.node-content');
        if (button && content) {
          button.setAttribute('aria-expanded', 'false');
          (content as HTMLElement).hidden = true;
        }
      });
      localStorage.setItem(EXPANDED_KEY, JSON.stringify([]));
    });
  }

  function initConceptFilter() {
    const focusBtns = document.querySelectorAll('[data-focus]');
    if (!focusBtns.length) return;

    const EXPANDED_KEY = `roadmap-expanded-${(window as any).trackSlug}`;

    function saveExpandedTopics(topics: string[]) {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(topics));
    }

    function applyFocus(filter: string) {
      if (filter === 'all') return; // "All" does nothing - use Expand All instead

      const topicsToExpand: string[] = [];

      // Find matching concepts
      document.querySelectorAll('.concept-pill').forEach(pill => {
        const topicId = pill.getAttribute('data-topic-id');
        const concept = pill.getAttribute('data-concept');
        const key = `${topicId}:${concept}`;

        let matches = false;

        if (filter === 'incomplete') {
          matches = !isComplete(key);
        } else if (filter === 'highlighted') {
          matches = isImportant(key);
        }

        if (matches && topicId && !topicsToExpand.includes(topicId)) {
          topicsToExpand.push(topicId);
        }
      });

      // Expand matching topics (collapse others)
      document.querySelectorAll('.roadmap-node').forEach(node => {
        const btn = node.querySelector('.node-button');
        const content = node.querySelector('.node-content');
        const topicId = node.getAttribute('data-node-id');
        if (btn && content && topicId) {
          const shouldExpand = topicsToExpand.includes(topicId);
          btn.setAttribute('aria-expanded', String(shouldExpand));
          (content as HTMLElement).hidden = !shouldExpand;
        }
      });

      // Save to persistence
      saveExpandedTopics(topicsToExpand);

      // Add glow to matching pills
      document.querySelectorAll('.concept-pill').forEach(pill => {
        const topicId = pill.getAttribute('data-topic-id');
        const concept = pill.getAttribute('data-concept');
        const key = `${topicId}:${concept}`;

        let matches = false;
        if (filter === 'incomplete') {
          matches = !isComplete(key);
        } else if (filter === 'highlighted') {
          matches = isImportant(key);
        }

        if (matches) {
          (pill as HTMLElement).style.animation = 'focus-glow 1s ease-out';
          setTimeout(() => {
            (pill as HTMLElement).style.animation = '';
          }, 1000);
        }
      });

      // Scroll to first match
      if (topicsToExpand.length > 0) {
        const firstNode = document.querySelector(`[data-node-id="${topicsToExpand[0]}"]`);
        if (firstNode) {
          setTimeout(() => {
            firstNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    }

    focusBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-focus') || 'all';
        applyFocus(filter);
      });
    });
  }

  // ============================================
  // INTERACTION MODE & TOOLS
  // ============================================
  let currentMode: ModeName = 'simple';
  let currentTool: ToolName = 'cursor';

  function initInteractionMode() {
    const modeSelect = document.getElementById('interaction-mode') as HTMLSelectElement;
    const toolbar = document.getElementById('toolbar');
    const simpleHints = document.getElementById('simple-hints');
    
    if (!modeSelect || !toolbar || !simpleHints) return;
    
    // Load saved preference
    const savedMode = localStorage.getItem('interaction-mode') || 'simple';
    currentMode = savedMode as 'simple' | 'tools';
    modeSelect.value = currentMode;
    toolbar.hidden = currentMode !== 'tools';
    simpleHints.hidden = currentMode !== 'simple';
    
    // Mode change handler
    modeSelect.addEventListener('change', () => {
      currentMode = modeSelect.value as 'simple' | 'tools';
      localStorage.setItem('interaction-mode', currentMode);
      toolbar.hidden = currentMode !== 'tools';
      simpleHints.hidden = currentMode !== 'simple';
      
      // Hide custom cursor when switching to simple
      if (currentMode === 'simple') {
        (window as any).customCursor?.hide();
        document.querySelector('.roadmap')?.classList.remove('tools-mode-active');
      }
    });

    // Custom cursor for tools mode
    const roadmap = document.querySelector('.roadmap');
    if (roadmap) {
      roadmap.addEventListener('mouseenter', () => {
        if (currentMode === 'tools') {
          (window as any).customCursor?.show();
          roadmap.classList.add('tools-active', 'tools-mode-active');
        }
      });
    
      roadmap.addEventListener('mouseleave', () => {
        (window as any).customCursor?.hide();
        roadmap.classList.remove('tools-active', 'tools-mode-active');
      });

      // Touch: prevent scroll when in tools mode, but only on interactive elements
      // Allow two-finger scroll for navigation
      roadmap.addEventListener('touchstart', (e) => {
        const touch = e as TouchEvent;
        if (currentMode === 'tools' && currentTool !== 'cursor' && touch.touches.length === 1) {
          const target = e.target as HTMLElement;
          if (target.classList.contains('concept-pill') || 
              target.classList.contains('prereq-tag--static') ||
              target.classList.contains('prereq-tag--link')) {
            e.preventDefault();
          }
        }
      }, { passive: false });

      roadmap.addEventListener('touchmove', (e) => {
        const touch = e as TouchEvent;
        if (currentMode === 'tools' && currentTool !== 'cursor' && isMouseDown && touch.touches.length === 1 && touchStartedOnInteractive) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }

  function initToolbar() {
    const tools = document.querySelectorAll('.tool[data-tool]');
    
    // Load saved tool
    const savedTool = localStorage.getItem('active-tool') || 'cursor';
    currentTool = savedTool as typeof currentTool;
    
    // Set initial state
    tools.forEach((tool) => {
      const toolName = tool.getAttribute('data-tool');
      tool.setAttribute('aria-pressed', String(toolName === currentTool));
    });
    
    // Tool selection handler
    tools.forEach((tool) => {
      tool.addEventListener('click', () => {
        const toolName = tool.getAttribute('data-tool') as typeof currentTool;
        if (!toolName) return;
        
        currentTool = toolName;
        localStorage.setItem('active-tool', currentTool);
        
        // Update all tool buttons
        tools.forEach((t) => {
          t.setAttribute('aria-pressed', String(t.getAttribute('data-tool') === currentTool));
        });
        
        // Update cursor icon
        (window as any).customCursor?.setTool(currentTool);
      });
    });

    // Set initial cursor icon
    (window as any).customCursor?.setTool(currentTool);
  }

  // ============================================
  // SWIPE GESTURES
  // ============================================
  let isMouseDown = false;
  const swipedPills: Set<string> = new Set();
  let touchStartedOnInteractive = false;

  function initSwipeGestures() {
    // Track mouse down state globally
    document.addEventListener('mousedown', () => {
      if (currentMode === 'tools') {
        isMouseDown = true;
        swipedPills.clear();
      }
    });
    
    document.addEventListener('mouseup', () => {
      isMouseDown = false;
      swipedPills.clear();
      
      // Remove swiping class from all pills
      document.querySelectorAll('.concept-pill--swiping').forEach((pill) => {
        pill.classList.remove('pill--swiping', 'concept-pill--swiping');
      });
    });

    // Touch events for mobile/tablet
    document.addEventListener('touchstart', (e) => {
      if (currentMode === 'tools' && currentTool !== 'cursor') {
        isMouseDown = true;
        swipedPills.clear();
        
        // Check if touch started on interactive element or its container
        const target = e.target as HTMLElement;
        touchStartedOnInteractive = target.classList.contains('concept-pill') ||
                                    target.classList.contains('prereq-tag--static') ||
                                    target.classList.contains('prereq-tag--link') ||
                                    target.closest('.node-content') !== null;
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      isMouseDown = false;
      swipedPills.clear();
      touchStartedOnInteractive = false;
      
      document.querySelectorAll('.concept-pill--swiping').forEach((pill) => {
        pill.classList.remove('pill--swiping', 'concept-pill--swiping');
      });
    });

    document.addEventListener('touchcancel', () => {
      isMouseDown = false;
      swipedPills.clear();
      touchStartedOnInteractive = false;
    });
    
    // Handle swipe on concept pills
    document.querySelectorAll('.concept-pill').forEach((pill) => {
      const topicId = pill.getAttribute('data-topic-id');
      const concept = pill.getAttribute('data-concept');
      if (!topicId || !concept) return;
      
      const key = `${topicId}:${concept}`;
      
      // Mouse enter while dragging = swipe action
      pill.addEventListener('mouseenter', () => {
        if (currentMode !== 'tools' || !isMouseDown) return;
        if (currentTool === 'cursor') return;
        if (swipedPills.has(key)) return; // Already swiped this pill
        
        swipedPills.add(key);
        pill.classList.add('pill--swiping', 'concept-pill--swiping');
        
        handleToolAction(pill as HTMLElement, key, topicId);
      });
      
      // Also handle mousedown directly on pill
      pill.addEventListener('mousedown', (e) => {
        if (currentMode !== 'tools') return;
        
        if (currentTool === 'cursor') {
          // Cursor = open notes on click
          const topicId = pill.getAttribute('data-topic-id');
          const conceptName = pill.getAttribute('data-concept');
          if (topicId && conceptName) {
            (window as any).conceptModal?.open(topicId, conceptName);
          }
          e.preventDefault();
          return;
        }
        
        // For other tools, start swipe
        swipedPills.add(key);
        pill.classList.add('pill--swiping', 'concept-pill--swiping');
        handleToolAction(pill as HTMLElement, key, topicId);
      });

      // Touch support
      pill.addEventListener('touchstart', (e) => {
        if (currentMode !== 'tools') return;

        if (currentTool === 'cursor') {
          const topicId = pill.getAttribute('data-topic-id');
          const conceptName = pill.getAttribute('data-concept');
          if (topicId && conceptName) {
            (window as any).conceptModal?.open(topicId, conceptName);
          }
          return;
        }

        e.preventDefault(); // Prevent scroll
        swipedPills.add(key);
        pill.classList.add('pill--swiping', 'concept-pill--swiping');
        handleToolAction(pill as HTMLElement, key, topicId);
      }, { passive: false });

      pill.addEventListener('touchmove', (e) => {
        if (currentMode !== 'tools' || currentTool === 'cursor') return;
        e.preventDefault(); // Prevent scroll while swiping
      }, { passive: false });
    });

    // Static prereqs - tools mode swipe support
    document.querySelectorAll('.prereq-tag--static[data-static-prereq]').forEach((tag) => {
      const prereq = tag.getAttribute('data-static-prereq');
      if (!prereq) return;
      
      const key = `static:${prereq}`;
      
      tag.addEventListener('mouseenter', () => {
        if (currentMode !== 'tools' || !isMouseDown) return;
        if (!canApplyToPrereq(currentTool)) return;
        if (swipedPills.has(key)) return;
        
        swipedPills.add(key);
        handleStaticPrereqAction(tag as HTMLElement, key);
      });
      
      tag.addEventListener('mousedown', () => {
        if (currentMode !== 'tools') return;
        if (!canApplyToPrereq(currentTool)) return;
        
        swipedPills.add(key);
        handleStaticPrereqAction(tag as HTMLElement, key);
      });

      // Touch support
      tag.addEventListener('touchstart', (e) => {
        if (currentMode !== 'tools') return;
        if (!canApplyToPrereq(currentTool)) return;

        e.preventDefault();
        swipedPills.add(key);
        handleStaticPrereqAction(tag as HTMLElement, key);
      }, { passive: false });
    });
  
    // Touch move to detect swipe across pills
    document.addEventListener('touchmove', (e) => {
      if (currentMode !== 'tools' || !isMouseDown || currentTool === 'cursor') return;
      if (!touchStartedOnInteractive) return;
      
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element?.classList.contains('concept-pill')) {
        const topicId = element.getAttribute('data-topic-id');
        const concept = element.getAttribute('data-concept');
        if (!topicId || !concept) return;
        
        const key = `${topicId}:${concept}`;
        if (!swipedPills.has(key)) {
          swipedPills.add(key);
          element.classList.add('concept-pill--swiping');
          handleToolAction(element as HTMLElement, key, topicId);
        }
      }
      
      // Also check static prereqs
      if (element?.classList.contains('prereq-tag--static')) {
        const prereq = element.getAttribute('data-static-prereq');
        if (!prereq) return;
        
        const key = `static:${prereq}`;
        if (!swipedPills.has(key) && currentTool !== 'highlighter') {
          swipedPills.add(key);
          handleStaticPrereqAction(element as HTMLElement, key);
        }
      }
    }, { passive: false });
  }

  function handleStaticPrereqAction(tag: HTMLElement, key: string) {
    if (!canApplyToPrereq(currentTool)) return;

    applyToolAction(currentTool, key, {
      setComplete,
      setImportant,
      resetState,
    });

    tag.classList.toggle('prereq--done', isComplete(key));
    tag.classList.toggle('prereq-tag--completed', isComplete(key));
  }

  function handleToolAction(pill: HTMLElement, key: string, topicId: string) {
    const changed = applyToolAction(currentTool, key, {
      setComplete,
      setImportant,
      resetState,
    });

    if (!changed) return;

    // Update UI based on current state
    pill.classList.toggle('pill--completed', isComplete(key));
    pill.classList.toggle('concept-pill--completed', isComplete(key));
    pill.classList.toggle('pill--important', isImportant(key));
    pill.classList.toggle('concept-pill--important', isImportant(key));
    updateTopicStatus(topicId);
    updatePrereqCompletionStatus();
    queueSync();
  }

  // ============================================
  // SWIPE TRAIL
  // ============================================

  let trailState: TrailState = { canvas: null, ctx: null, lastPos: null };

  function initSwipeTrail() {
    trailState = initTrailCanvas('swipe-trail-canvas');

    document.addEventListener('mousemove', (e) => {
      if (currentMode !== 'tools' || !isMouseDown || currentTool === 'cursor') {
        trailState.lastPos = null;
        return;
      }

      const currentPos = { x: e.clientX, y: e.clientY };

      if (trailState.lastPos) {
        drawTrailLine(trailState, trailState.lastPos, currentPos, currentTool);
      }

      trailState.lastPos = currentPos;
    });

    document.addEventListener('mouseup', () => {
      trailState.lastPos = null;
      fadeOutTrail(trailState);
    });

    document.addEventListener('mousedown', () => {
      trailState.lastPos = null;
    });

    // Touch trail support
    document.addEventListener('touchmove', (e) => {
      if (currentMode !== 'tools' || !isMouseDown || currentTool === 'cursor') {
        trailState.lastPos = null;
        return;
      }

      if (!touchStartedOnInteractive) {
        trailState.lastPos = null;
        return;
      }

      const touch = e.touches[0];
      const currentPos = { x: touch.clientX, y: touch.clientY };

      // Only draw trail inside .node-content
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      const isInsideContent = elementUnderTouch?.closest('.node-content') !== null;

      if (trailState.lastPos && isInsideContent) {
        drawTrailLine(trailState, trailState.lastPos, currentPos, currentTool);
      }

      trailState.lastPos = isInsideContent ? currentPos : null;
    }, { passive: false });

    document.addEventListener('touchend', () => {
      trailState.lastPos = null;
      isMouseDown = false;
      fadeOutTrail(trailState);
    });

    document.addEventListener('touchcancel', () => {
      trailState.lastPos = null;
      isMouseDown = false;
      clearTrail(trailState);
    });
  }

  // ============================================
  // CUSTOM CONCEPTS (from Supabase)
  // ============================================
  async function initCustomConcepts() {
    const { injectCustomConcepts, loadConceptNotes, addCustomConceptButtons } = await import('../utils/customContent');
    const track = (window as any).trackSlug;
    if (!track) return;

    await injectCustomConcepts(track);
    await loadConceptNotes();
    await addCustomConceptButtons(track);

    // Re-init progress tracking for newly injected pills
    document.querySelectorAll('.concept-pill--custom').forEach((pill) => {
      const topicId = pill.getAttribute('data-topic-id');
      const concept = pill.getAttribute('data-concept');
      if (!topicId || !concept) return;

      const key = `${topicId}:${concept}`;

      // Set initial state
      if (isComplete(key)) {
        pill.classList.add('concept-pill--completed');
      }
      if (isImportant(key)) {
        pill.classList.add('concept-pill--important');
      }

      // Bind click handlers (same as regular pills)
      let clickTimer: number | null = null;

      pill.addEventListener('click', (e) => {
        if (currentMode !== 'simple') return;
        if ((e as MouseEvent).shiftKey) {
          const important = toggleImportant(key);
          pill.classList.toggle('concept-pill--important', important);
          queueSync();
          return;
        }

        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
          const completed = toggleComplete(key);
          pill.classList.toggle('concept-pill--completed', completed);
          updateTopicStatus(topicId);
          queueSync();
        } else {
          clickTimer = window.setTimeout(() => {
            clickTimer = null;
            (window as any).conceptModal?.open(topicId, concept);
          }, 250);
        }
      });
    });
  }

  // ============================================
  // INIT
  // ============================================
  initNodeToggles();
  initHashNavigation();
  initProgressTracking();
  initStaticPrereqs();
  initPrereqBehavior();
  initSettingsPanel();
  initExpandCollapseAll();
  initConceptFilter();
  initInteractionMode();
  initToolbar();
  initSwipeGestures();
  initSwipeTrail();
  // Load custom concepts after page init
  initCustomConcepts();
}