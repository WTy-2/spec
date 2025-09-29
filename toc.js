// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded affix "><li class="part-title">Posts</li><li class="chapter-item expanded "><a href="New/green_slime.html"><strong aria-hidden="true">1.</strong> Green Slime</a></li><li class="chapter-item expanded affix "><li class="part-title">WTy2 (Some OLD Ideas Here)</li><li class="chapter-item expanded "><a href="summary/introduction.html"><strong aria-hidden="true">2.</strong> Introduction</a></li><li class="chapter-item expanded "><div><strong aria-hidden="true">3.</strong> Basic Concepts</div></li><li><ol class="section"><li class="chapter-item expanded "><a href="basic_concepts/core_types.html"><strong aria-hidden="true">3.1.</strong> Core Types</a></li><li class="chapter-item expanded "><a href="basic_concepts/arrows.html"><strong aria-hidden="true">3.2.</strong> Common Type Operators</a></li><li class="chapter-item expanded "><a href="basic_concepts/functions.html"><strong aria-hidden="true">3.3.</strong> Functions</a></li><li class="chapter-item expanded "><a href="basic_concepts/records.html"><strong aria-hidden="true">3.4.</strong> Records</a></li><li class="chapter-item expanded "><a href="basic_concepts/declarations.html"><strong aria-hidden="true">3.5.</strong> Declarations</a></li><li class="chapter-item expanded "><a href="basic_concepts/erasure_visibility.html"><strong aria-hidden="true">3.6.</strong> Erasure and Visibility</a></li><li class="chapter-item expanded "><a href="basic_concepts/coherence.html"><strong aria-hidden="true">3.7.</strong> Coherence</a></li><li class="chapter-item expanded "><a href="basic_concepts/modules.html"><strong aria-hidden="true">3.8.</strong> Modules</a></li></ol></li><li class="chapter-item expanded "><div><strong aria-hidden="true">4.</strong> Extra</div></li><li><ol class="section"><li class="chapter-item expanded "><a href="extra/utilities.html"><strong aria-hidden="true">4.1.</strong> Utilities</a></li></ol></li><li class="chapter-item expanded "><div><strong aria-hidden="true">5.</strong> Dependent Types</div></li><li><ol class="section"><li class="chapter-item expanded "><a href="dependent_types/constraints.html"><strong aria-hidden="true">5.1.</strong> Constraints</a></li><li class="chapter-item expanded "><a href="dependent_types/proofs.html"><strong aria-hidden="true">5.2.</strong> Proofs</a></li><li class="chapter-item expanded "><a href="dependent_types/dependent_types.html"><strong aria-hidden="true">5.3.</strong> Dependent Types</a></li></ol></li><li class="chapter-item expanded "><div><strong aria-hidden="true">6.</strong> Implementation</div></li><li><ol class="section"><li class="chapter-item expanded "><a href="implementation/low_level.html"><strong aria-hidden="true">6.1.</strong> Low-level Semantics</a></li><li class="chapter-item expanded "><a href="implementation/run_rep.html"><strong aria-hidden="true">6.2.</strong> Runtime Representation</a></li><li class="chapter-item expanded "><a href="implementation/subset.html"><strong aria-hidden="true">6.3.</strong> Core Subset</a></li><li class="chapter-item expanded "><a href="implementation/specialisation.html"><strong aria-hidden="true">6.4.</strong> Specialisation</a></li></ol></li><li class="chapter-item expanded "><div><strong aria-hidden="true">7.</strong> Design</div></li><li><ol class="section"><li class="chapter-item expanded "><a href="design/soundness.html"><strong aria-hidden="true">7.1.</strong> Soundness</a></li><li class="chapter-item expanded "><a href="design/wadlers_law.html"><strong aria-hidden="true">7.2.</strong> Syntax Debates</a></li></ol></li><li class="chapter-item expanded "><li class="part-title">Extremely Old</li><li class="chapter-item expanded "><a href="old/allocators.html"><strong aria-hidden="true">8.</strong> Type Aware Allocators</a></li><li class="chapter-item expanded "><a href="old/recursive_types.html"><strong aria-hidden="true">9.</strong> Recursive Types</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
